import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GamePhase,
  GameState,
  PlayerPhase,
  Card,
} from '../../types';
import {
  createGame,
  processAction,
  getPlayableCards,
  decideCpuAction,
  decideCpuJumpIn,
  isSpecialCard,
} from '../../engine';

const CPU_TURN_DELAY = 700;
const CPU_CONTINUE_DELAY = 500;
const CPU_JUMPIN_MIN_DELAY = 300;
const CPU_JUMPIN_MAX_DELAY = 800;
const MAX_CPU_ITERATIONS = 50;

export function useGameController() {
  const [gameState, setGameState] = useState<GameState>(() => createGame());
  const [isProcessing, setIsProcessing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      for (const t of timeoutRef.current) clearTimeout(t);
    };
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

  const humanPlayer = gameState.players[0];
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
    return [];
  }, [humanPlayer]);

  // --- CPU turn orchestration ---
  const runCpuTurns = useCallback((state: GameState) => {
    if (state.gamePhase !== GamePhase.Playing) return;
    if (state.currentPlayerIndex === 0) return;

    setIsProcessing(true);
    let current = state;
    let iterations = 0;

    const step = () => {
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
      setGameState(current);

      // Check for CPU jump-ins after non-special plays
      const playedEvent = result.events.find((e) => e.type === 'CARDS_PLAYED');
      if (playedEvent && playedEvent.type === 'CARDS_PLAYED' && !isSpecialCard(playedEvent.cards[0]!)) {
        // Check other CPUs for jump-in
        for (let i = 1; i <= 3; i++) {
          if (i === cpuIndex) continue;
          const jumpAction = decideCpuJumpIn(current, i);
          if (jumpAction) {
            const jumpResult = processAction(current, jumpAction);
            current = jumpResult.state;
            setGameState(current);
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

    scheduleTimeout(step, CPU_TURN_DELAY);
  }, [scheduleTimeout]);

  // Watch for CPU turns
  useEffect(() => {
    if (
      gameState.gamePhase === GamePhase.Playing &&
      gameState.currentPlayerIndex !== 0 &&
      !isProcessing
    ) {
      runCpuTurns(gameState);
    }
  }, [gameState.currentPlayerIndex, gameState.gamePhase, isProcessing, runCpuTurns]);

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

  const flipFaceDown = useCallback((slotIndex: number) => {
    try {
      const result = processAction(gameState, {
        type: 'FLIP_FACE_DOWN',
        playerIndex: 0,
        slotIndex,
      });
      setGameState(result.state);
    } catch (e) {
      console.warn('Invalid flip:', e);
    }
  }, [gameState]);

  const jumpIn = useCallback((cardIds: string[]) => {
    try {
      const result = processAction(gameState, {
        type: 'JUMP_IN',
        playerIndex: 0,
        cardIds,
      });
      setGameState(result.state);
    } catch (e) {
      console.warn('Invalid jump-in:', e);
    }
  }, [gameState]);

  const newGame = useCallback(() => {
    clearTimeouts();
    setIsProcessing(false);
    setGameState(createGame());
  }, [clearTimeouts]);

  return {
    gameState,
    isProcessing,
    playableCardIds,
    playableZone,
    isHumanTurn,
    canPickUp,
    newGame,
    chooseFaceUp,
    playCards,
    pickUpPile,
    flipFaceDown,
    jumpIn,
  };
}
