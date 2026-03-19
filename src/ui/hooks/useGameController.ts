import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Card,
  GameConfig,
  GamePhase,
  GameState,
  PlayerPhase,
  DEFAULT_CONFIG,
} from '../../types';
import {
  createGame,
  processAction,
  getPlayableCards,
  decideCpuAction,
  decideCpuJumpIn,
  isSpecialCard,
} from '../../engine';

const CPU_TURN_DELAY = 1200;
const CPU_CONTINUE_DELAY = 800;
const CPU_JUMPIN_MIN_DELAY = 300;
const CPU_JUMPIN_MAX_DELAY = 800;
const MAX_CPU_ITERATIONS = 50;

export function useGameController(config: GameConfig = DEFAULT_CONFIG) {
  const [gameState, setGameState] = useState<GameState>(() => createGame(config));
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const configRef = useRef(config);
  configRef.current = config;
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      for (const t of timeoutRef.current) clearTimeout(t);
    };
  }, []);

  const updateState = useCallback((state: GameState) => {
    gameStateRef.current = state;
    setGameState(state);
  }, []);

  const clearTimeouts = useCallback(() => {
    for (const t of timeoutRef.current) clearTimeout(t);
    timeoutRef.current = [];
  }, []);

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timeoutRef.current.push(t);
    return t;
  }, []);

  const humanPlayer = gameState.players[0]!;
  const isHumanTurn = gameState.currentPlayerIndex === 0 && !isProcessing && gameState.gamePhase === GamePhase.Playing;

  const playableCards = useMemo(() => {
    if (!isHumanTurn) return [];
    return getPlayableCards(humanPlayer, gameState.pile);
  }, [isHumanTurn, humanPlayer, gameState.pile]);

  const playableCardIds = useMemo(() => new Set(playableCards.map((c) => c.id)), [playableCards]);

  const canPickUp = isHumanTurn && !gameState.mustPlayAgain && gameState.pile.length > 0;

  // Get the playable zone for card selection
  const playableZone = useMemo((): readonly Card[] => {
    if (humanPlayer.phase === PlayerPhase.HandAndDraw || humanPlayer.phase === PlayerPhase.HandOnly) {
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

  // --- Jump-in state ---
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
    return new Set(humanPlayer.hand.filter((c) => c.rank === w.cardRank).map((c) => c.id));
  }, [canHumanJumpIn, gameState.jumpInWindow, humanPlayer.hand]);

  // --- CPU turn orchestration ---
  const runCpuTurns = useCallback((state: GameState) => {
    if (state.gamePhase !== GamePhase.Playing) return;
    if (state.currentPlayerIndex === 0) return;

    setIsProcessing(true);
    let current = state;
    let iterations = 0;

    const step = () => {
      // Pick up latest state (incorporates any off-turn human actions)
      current = gameStateRef.current;

      if (iterations++ > MAX_CPU_ITERATIONS) {
        setIsProcessing(false);
        return;
      }

      if (current.gamePhase === GamePhase.Finished || current.currentPlayerIndex === 0) {
        setIsProcessing(false);
        return;
      }

      const cpuIndex = current.currentPlayerIndex;
      const action = decideCpuAction(current, cpuIndex);
      const result = processAction(current, action);
      current = result.state;
      updateState(current);

      // If CPU just revealed a face-down card, immediately decide and play the follow-up
      if (action.type === 'REVEAL_TO_HAND' && current.currentPlayerIndex === cpuIndex) {
        const followUp = decideCpuAction(current, cpuIndex);
        const followUpResult = processAction(current, followUp);
        current = followUpResult.state;
        updateState(current);
      }

      // Auto-reveal face-down cards for all CPUs (ensures they have a card for jump-ins)
      for (let i = 1; i < current.players.length; i++) {
        const p = current.players[i]!;
        if (p.phase === PlayerPhase.FaceDown && p.hand.length === 0 && p.faceDown.length > 0) {
          const revealResult = processAction(current, { type: 'REVEAL_TO_HAND', playerIndex: i, slotIndex: 0 });
          current = revealResult.state;
          updateState(current);
        }
      }

      // Check for CPU jump-ins after non-special plays
      const playedEvent = result.events.find((e) => e.type === 'CARDS_PLAYED');
      if (playedEvent && playedEvent.type === 'CARDS_PLAYED' && !isSpecialCard(playedEvent.cards[0]!)) {
        // Check other CPUs for jump-in
        for (let i = 1; i < current.players.length; i++) {
          const jumpAction = decideCpuJumpIn(current, i);
          if (jumpAction) {
            const jumpResult = processAction(current, jumpAction);
            current = jumpResult.state;
            updateState(current);
            break; // Only one jump-in per play
          }
        }
      }

      if (current.gamePhase === GamePhase.Finished || current.currentPlayerIndex === 0) {
        setIsProcessing(false);
        return;
      }

      // Continue with next CPU turn after delay
      const delay = current.mustPlayAgain ? CPU_CONTINUE_DELAY : CPU_TURN_DELAY;
      scheduleTimeout(step, delay);
    };

    // Check for CPU jump-ins on human's play before first regular CPU step
    if (current.jumpInWindow && current.jumpInWindow.playedByIndex === 0) {
      const jumpInDelay = CPU_JUMPIN_MIN_DELAY + Math.random() * (CPU_JUMPIN_MAX_DELAY - CPU_JUMPIN_MIN_DELAY);
      scheduleTimeout(() => {
        // Check if CPUs want to jump in on the human's play
        for (let i = 1; i < current.players.length; i++) {
          const jumpAction = decideCpuJumpIn(current, i);
          if (jumpAction) {
            const jumpResult = processAction(current, jumpAction);
            current = jumpResult.state;
            updateState(current);
            break;
          }
        }
        // Continue with normal CPU turns
        if (current.gamePhase === GamePhase.Finished || current.currentPlayerIndex === 0) {
          setIsProcessing(false);
          return;
        }
        scheduleTimeout(step, CPU_TURN_DELAY);
      }, jumpInDelay);
    } else {
      scheduleTimeout(step, CPU_TURN_DELAY);
    }
  }, [scheduleTimeout, updateState]);

  // Watch for CPU turns
  useEffect(() => {
    if (
      gameState.gamePhase === GamePhase.Playing &&
      gameState.currentPlayerIndex !== 0 &&
      !isProcessing &&
      !isPaused
    ) {
      runCpuTurns(gameState);
    }
  }, [gameState.currentPlayerIndex, gameState.gamePhase, isProcessing, isPaused, runCpuTurns]);

  // --- Human actions ---
  const chooseFaceUp = useCallback((cardIds: string[]) => {
    let state = gameState;

    // Human chooses
    const result = processAction(state, {
      type: 'CHOOSE_FACE_UP',
      playerIndex: 0,
      cardIds,
    });
    state = result.state;

    // Auto-run CPU setup choices
    while (state.gamePhase === GamePhase.Setup && state.currentPlayerIndex !== 0) {
      const cpuAction = decideCpuAction(state, state.currentPlayerIndex);
      const cpuResult = processAction(state, cpuAction);
      state = cpuResult.state;
    }

    setGameState(state);
  }, [gameState]);

  const playCards = useCallback((cardIds: string[]) => {
    try {
      const result = processAction(gameState, {
        type: 'PLAY_CARDS',
        playerIndex: 0,
        cardIds,
      });
      setGameState(result.state);
    } catch (e) {
      console.warn('Invalid play:', e);
    }
  }, [gameState]);

  const pickUpPile = useCallback(() => {
    try {
      const result = processAction(gameState, {
        type: 'PICK_UP_PILE',
        playerIndex: 0,
      });
      setGameState(result.state);
    } catch (e) {
      console.warn('Invalid pickup:', e);
    }
  }, [gameState]);

  const revealToHand = useCallback((slotIndex: number) => {
    try {
      const result = processAction(gameStateRef.current, {
        type: 'REVEAL_TO_HAND',
        playerIndex: 0,
        slotIndex,
      });
      gameStateRef.current = result.state;
      setGameState(result.state);
    } catch (e) {
      console.warn('Invalid reveal:', e);
    }
  }, []);

  const jumpIn = useCallback((cardIds: string[]) => {
    try {
      clearTimeouts();
      setIsProcessing(false);
      const result = processAction(gameStateRef.current, {
        type: 'JUMP_IN',
        playerIndex: 0,
        cardIds,
      });
      gameStateRef.current = result.state;
      setGameState(result.state);
    } catch (e) {
      console.warn('Invalid jump-in:', e);
    }
  }, [clearTimeouts]);

  const pause = useCallback(() => {
    clearTimeouts();
    setIsProcessing(false);
    setIsPaused(true);
  }, [clearTimeouts]);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const newGame = useCallback(() => {
    clearTimeouts();
    setIsProcessing(false);
    setIsPaused(false);
    setGameState(createGame(configRef.current));
  }, [clearTimeouts]);

  return {
    gameState,
    isProcessing,
    playableCardIds,
    playableZone,
    isHumanTurn,
    canPickUp,
    canHumanJumpIn,
    jumpInCardIds,
    isPaused,
    pause,
    resume,
    newGame,
    chooseFaceUp,
    playCards,
    pickUpPile,
    revealToHand,
    jumpIn,
  };
}
