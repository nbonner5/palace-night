import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Card,
  GamePhase,
  GameState,
  PlayerPhase,
  PlayerState,
  Rank,
  Suit,
} from '../../types';
import {
  ClientMessage,
  FilteredGameState,
  FilteredPlayerState,
  ServerMessage,
} from '../../types/multiplayer';
import { getPlayableCards, canPlayOn } from '../../engine';

// ── Adapter: FilteredGameState → GameState ──

function makePlaceholders(count: number, prefix: string): Card[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `_${prefix}_${i}`,
    rank: Rank.Two,
    suit: Suit.Hearts as Suit | null,
  }));
}

function adaptPlayer(fp: FilteredPlayerState, isSelf: boolean, localId: number): PlayerState {
  return {
    id: localId,
    hand: isSelf ? [...fp.hand] : makePlaceholders(fp.handCount, `h${fp.id}`),
    faceUp: [...fp.faceUp],
    faceDown: makePlaceholders(fp.faceDownCount, `fd${fp.id}`),
    phase: fp.phase,
  };
}

function adaptFilteredState(filtered: FilteredGameState): GameState {
  const count = filtered.players.length;
  const seat = filtered.yourSeatIndex;

  // Rotate so your seat is index 0
  const players: PlayerState[] = [];
  for (let i = 0; i < count; i++) {
    const serverIdx = (i + seat) % count;
    const fp = filtered.players[serverIdx]!;
    players.push(adaptPlayer(fp, serverIdx === seat, i));
  }

  const rotateIdx = (idx: number) => ((idx - seat + count) % count);

  return {
    gamePhase: filtered.gamePhase,
    drawPile: makePlaceholders(filtered.drawPileCount, 'draw'),
    pile: [...filtered.pile],
    burnPile: makePlaceholders(filtered.burnPileCount, 'burn'),
    players,
    config: { cpuCount: count - 1, deckCount: 1, includeJokers: true },
    currentPlayerIndex: rotateIdx(filtered.currentPlayerIndex),
    mustPlayAgain: filtered.mustPlayAgain,
    jumpInWindow: filtered.jumpInWindow
      ? {
          cardRank: filtered.jumpInWindow.cardRank,
          playedByIndex: rotateIdx(filtered.jumpInWindow.playedByIndex),
        }
      : null,
    winnerId: filtered.winnerId !== null ? rotateIdx(filtered.winnerId) : null,
    turnNumber: filtered.turnNumber,
    setupChoicesRemaining: filtered.setupChoicesRemaining,
    actionLog: filtered.actionLog,
  };
}

// ── Hook ──

interface UseMultiplayerControllerOptions {
  send: (msg: ClientMessage) => void;
  onMessage: (type: string, listener: (msg: ServerMessage) => void) => () => void;
}

export function useMultiplayerController({ send, onMessage }: UseMultiplayerControllerOptions) {
  const [filteredState, setFilteredState] = useState<FilteredGameState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Record<number, number>>({});
  const [rematchReady, setRematchReady] = useState<{
    players: { localIndex: number; displayName: string; isReady: boolean }[];
    lobbyCode: string;
  } | null>(null);
  const [hasChosenFaceUp, setHasChosenFaceUp] = useState(false);
  const stateVersionRef = useRef(0);
  const filteredStateRef = useRef<FilteredGameState | null>(null);
  // Listen for state updates from server
  useEffect(() => {
    const unsubs = [
      onMessage('GAME_STARTED', (msg) => {
        if (msg.type === 'GAME_STARTED') {
          setFilteredState(msg.state);
          filteredStateRef.current = msg.state;
          stateVersionRef.current = msg.state.stateVersion;
          setIsProcessing(false);
          setHasChosenFaceUp(false);
        }
      }),
      onMessage('GAME_STATE_UPDATE', (msg) => {
        if (msg.type === 'GAME_STATE_UPDATE') {
          setFilteredState(msg.state);
          filteredStateRef.current = msg.state;
          stateVersionRef.current = msg.state.stateVersion;
          setIsProcessing(false);
        }
      }),
      onMessage('GAME_OVER', (msg) => {
        if (msg.type === 'GAME_OVER') {
          setFilteredState(msg.finalState);
          filteredStateRef.current = msg.finalState;
          stateVersionRef.current = msg.finalState.stateVersion;
          // Rotate leaderboard keys to match local player order
          if (msg.leaderboard) {
            const count = msg.finalState.players.length;
            const seat = msg.finalState.yourSeatIndex;
            const rotated: Record<number, number> = {};
            for (const [key, val] of Object.entries(msg.leaderboard)) {
              const serverIdx = parseInt(key, 10);
              const localIdx = ((serverIdx - seat + count) % count);
              rotated[localIdx] = val;
            }
            setLeaderboard(rotated);
          }
        }
      }),
      onMessage('REMATCH_UPDATE', (msg) => {
        if (msg.type === 'REMATCH_UPDATE') {
          const yourSeat = msg.yourSeatIndex;
          const count = msg.players.length;
          setRematchReady({
            players: msg.players.map((p) => ({
              localIndex: ((p.seatIndex - yourSeat + count) % count),
              displayName: p.displayName,
              isReady: p.isReady,
            })),
            lobbyCode: msg.lobbyCode,
          });
        }
      }),
      onMessage('REMATCH_STARTED', (msg) => {
        if (msg.type === 'REMATCH_STARTED') {
          setFilteredState(msg.state);
          filteredStateRef.current = msg.state;
          stateVersionRef.current = msg.state.stateVersion;
          setIsProcessing(false);
          setRematchReady(null);
          setHasChosenFaceUp(false);
        }
      }),
    ];
    return () => {
      unsubs.forEach((u) => u());
    };
  }, [onMessage]);

  // Adapted game state for the UI
  const gameState: GameState = useMemo(() => {
    if (!filteredState) {
      // Return a minimal empty state before game starts
      return {
        gamePhase: GamePhase.Setup,
        drawPile: [],
        pile: [],
        burnPile: [],
        players: [
          { id: 0, hand: [], faceUp: [], faceDown: [], phase: PlayerPhase.HandAndDraw },
        ],
        config: { cpuCount: 0, deckCount: 1, includeJokers: true },
        currentPlayerIndex: 0,
        mustPlayAgain: false,
        jumpInWindow: null,
        winnerId: null,
        turnNumber: 0,
        setupChoicesRemaining: 0,
        actionLog: [],
      };
    }
    return adaptFilteredState(filteredState);
  }, [filteredState]);

  const humanPlayer = gameState.players[0]!;
  const isHumanTurn =
    gameState.currentPlayerIndex === 0 &&
    !isProcessing &&
    gameState.gamePhase === GamePhase.Playing;

  const playableCards = useMemo(() => {
    if (!isHumanTurn) return [];
    return getPlayableCards(humanPlayer, gameState.pile);
  }, [isHumanTurn, humanPlayer, gameState.pile]);

  const playableCardIds = useMemo(
    () => new Set(playableCards.map((c) => c.id)),
    [playableCards]
  );

  const canPickUp =
    isHumanTurn && !gameState.mustPlayAgain && gameState.pile.length > 0;

  const playableZone = useMemo((): readonly Card[] => {
    if (
      humanPlayer.phase === PlayerPhase.HandAndDraw ||
      humanPlayer.phase === PlayerPhase.HandOnly
    ) {
      return humanPlayer.hand;
    }
    if (humanPlayer.phase === PlayerPhase.FaceUp) {
      return humanPlayer.faceUp;
    }
    if (humanPlayer.phase === PlayerPhase.FaceDown) {
      return humanPlayer.hand;
    }
    return [];
  }, [humanPlayer]);

  // Jump-in state
  const canHumanJumpIn = useMemo(() => {
    const w = gameState.jumpInWindow;
    if (!w) return false;
    if (humanPlayer.phase === PlayerPhase.FaceUp) return false;
    if (humanPlayer.phase === PlayerPhase.FaceDown && humanPlayer.hand.length === 0) return false;
    return humanPlayer.hand.some((c) => c.rank === w.cardRank);
  }, [gameState.jumpInWindow, humanPlayer]);

  const jumpInCardIds = useMemo(() => {
    const w = gameState.jumpInWindow;
    if (!canHumanJumpIn || !w) return new Set<string>();
    return new Set(
      humanPlayer.hand.filter((c) => c.rank === w.cardRank).map((c) => c.id)
    );
  }, [canHumanJumpIn, gameState.jumpInWindow, humanPlayer.hand]);

  // Convert local index 0 → server seat index
  const toServerIndex = useCallback(() => {
    return filteredState?.yourSeatIndex ?? 0;
  }, [filteredState]);

  // ── Action handlers ──

  const chooseFaceUp = useCallback(
    (cardIds: string[]) => {
      setIsProcessing(true);
      setHasChosenFaceUp(true);
      send({
        type: 'GAME_ACTION',
        action: {
          type: 'CHOOSE_FACE_UP',
          playerIndex: toServerIndex(),
          cardIds,
        },
        stateVersion: stateVersionRef.current,
      });
    },
    [send, toServerIndex]
  );

  const playCards = useCallback(
    (cardIds: string[]) => {
      setIsProcessing(true);
      send({
        type: 'GAME_ACTION',
        action: {
          type: 'PLAY_CARDS',
          playerIndex: toServerIndex(),
          cardIds,
        },
        stateVersion: stateVersionRef.current,
      });
    },
    [send, toServerIndex]
  );

  const pickUpPile = useCallback(() => {
    setIsProcessing(true);
    send({
      type: 'GAME_ACTION',
      action: {
        type: 'PICK_UP_PILE',
        playerIndex: toServerIndex(),
      },
      stateVersion: stateVersionRef.current,
    });
  }, [send, toServerIndex]);

  const revealToHand = useCallback(
    (slotIndex: number) => {
      setIsProcessing(true);
      send({
        type: 'GAME_ACTION',
        action: {
          type: 'REVEAL_TO_HAND',
          playerIndex: toServerIndex(),
          slotIndex,
        },
        stateVersion: stateVersionRef.current,
      });
    },
    [send, toServerIndex]
  );

  const jumpIn = useCallback(
    (cardIds: string[]) => {
      setIsProcessing(true);
      send({
        type: 'GAME_ACTION',
        action: {
          type: 'JUMP_IN',
          playerIndex: toServerIndex(),
          cardIds,
        },
        stateVersion: stateVersionRef.current,
      });
    },
    [send, toServerIndex]
  );

  // Rotated seat names (index 0 = local player)
  const rotatedSeatNames = useMemo(() => {
    if (!filteredState) return [];
    const { players, yourSeatIndex, seatNames } = filteredState;
    return players.map((_, i) => seatNames[(i + yourSeatIndex) % players.length] ?? `Player ${i}`);
  }, [filteredState]);

  const requestRematch = useCallback(
    (ready: boolean) => {
      send({ type: 'SET_REMATCH_READY', ready } as ClientMessage);
    },
    [send]
  );

  // No-ops for multiplayer (server manages these)
  const pause = useCallback(() => {}, []);
  const resume = useCallback(() => {}, []);
  const newGame = useCallback(() => {}, []);

  return {
    gameState,
    isProcessing,
    playableCardIds,
    playableZone,
    isHumanTurn,
    canPickUp,
    canHumanJumpIn,
    jumpInCardIds,
    isPaused: false,
    pause,
    resume,
    newGame,
    chooseFaceUp,
    playCards,
    pickUpPile,
    revealToHand,
    jumpIn,
    // Multiplayer-specific
    hasChosenFaceUp,
    seatNames: rotatedSeatNames,
    seatConnected: filteredState?.seatConnected ?? [],
    leaderboard,
    rematchReady,
    requestRematch,
  };
}
