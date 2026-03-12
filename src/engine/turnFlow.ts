import {
  Card,
  GameEvent,
  GamePhase,
  GameState,
  PlayerPhase,
  PlayerState,
} from '../types';

interface FlowResult {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

export function drawCards(state: GameState, playerIndex: number): FlowResult {
  const player = state.players[playerIndex]!;
  const events: GameEvent[] = [];

  // Only draw during HandAndDraw phase
  if (player.phase !== PlayerPhase.HandAndDraw) {
    return { state, events };
  }

  // Draw to maintain 3 in hand
  const needed = Math.max(0, 3 - player.hand.length);
  if (needed === 0 || state.drawPile.length === 0) {
    return { state, events };
  }

  const drawCount = Math.min(needed, state.drawPile.length);
  const drawn = state.drawPile.slice(0, drawCount);
  const newDrawPile = state.drawPile.slice(drawCount);

  const newHand = [...player.hand, ...drawn];
  const newPlayer: PlayerState = { ...player, hand: newHand };

  const newPlayers = state.players.map((p, i) =>
    i === playerIndex ? newPlayer : p
  );

  events.push({
    type: 'CARD_DRAWN',
    playerIndex,
    count: drawCount,
  });

  return {
    state: { ...state, drawPile: newDrawPile, players: newPlayers },
    events,
  };
}

export function checkPhaseTransition(
  state: GameState,
  playerIndex: number
): FlowResult {
  const events: GameEvent[] = [];
  let currentState = state;

  // When draw pile empties, ALL players in HandAndDraw transition to HandOnly
  if (currentState.drawPile.length === 0) {
    const newPlayers = currentState.players.map((p, i) => {
      if (p.phase === PlayerPhase.HandAndDraw) {
        events.push({
          type: 'PHASE_CHANGE',
          playerIndex: i,
          from: PlayerPhase.HandAndDraw,
          to: PlayerPhase.HandOnly,
        });
        return { ...p, phase: PlayerPhase.HandOnly };
      }
      return p;
    });
    currentState = { ...currentState, players: newPlayers };
  }

  const player = currentState.players[playerIndex]!;

  // HandOnly → FaceUp: when hand is empty and faceUp has cards
  // Actually: pick up faceUp into hand, stay HandOnly
  if (
    player.phase === PlayerPhase.HandOnly &&
    player.hand.length === 0 &&
    player.faceUp.length > 0
  ) {
    events.push({
      type: 'PHASE_CHANGE',
      playerIndex,
      from: PlayerPhase.HandOnly,
      to: PlayerPhase.FaceUp,
    });

    // Move faceUp → hand
    const newPlayer: PlayerState = {
      ...player,
      hand: [...player.faceUp],
      faceUp: [],
      phase: PlayerPhase.HandOnly,
    };

    const newPlayers = currentState.players.map((p, i) =>
      i === playerIndex ? newPlayer : p
    );
    currentState = { ...currentState, players: newPlayers };
  }

  // HandOnly with no hand, no faceUp → FaceDown
  const updatedPlayer = currentState.players[playerIndex]!;
  if (
    updatedPlayer.phase === PlayerPhase.HandOnly &&
    updatedPlayer.hand.length === 0 &&
    updatedPlayer.faceUp.length === 0 &&
    updatedPlayer.faceDown.length > 0
  ) {
    events.push({
      type: 'PHASE_CHANGE',
      playerIndex,
      from: PlayerPhase.HandOnly,
      to: PlayerPhase.FaceDown,
    });

    const newPlayer: PlayerState = {
      ...updatedPlayer,
      phase: PlayerPhase.FaceDown,
    };

    const newPlayers = currentState.players.map((p, i) =>
      i === playerIndex ? newPlayer : p
    );
    currentState = { ...currentState, players: newPlayers };
  }

  return { state: currentState, events };
}

export function advanceTurn(state: GameState): FlowResult {
  const events: GameEvent[] = [];

  if (state.mustPlayAgain) {
    return { state: { ...state, mustPlayAgain: false }, events };
  }

  // Next player clockwise, skip winners
  let next = (state.currentPlayerIndex + 1) % state.players.length;
  let attempts = 0;
  while (attempts < state.players.length) {
    const player = state.players[next]!;
    const isEmpty =
      player.hand.length === 0 &&
      player.faceUp.length === 0 &&
      player.faceDown.length === 0;
    if (!isEmpty) break;
    next = (next + 1) % state.players.length;
    attempts++;
  }

  events.push({
    type: 'TURN_CHANGE',
    from: state.currentPlayerIndex,
    to: next,
  });

  return {
    state: {
      ...state,
      currentPlayerIndex: next,
      turnNumber: state.turnNumber + 1,
    },
    events,
  };
}

export function checkWin(state: GameState, playerIndex: number): GameState {
  const player = state.players[playerIndex]!;

  if (
    player.hand.length === 0 &&
    player.faceUp.length === 0 &&
    player.faceDown.length === 0
  ) {
    return {
      ...state,
      winnerId: playerIndex,
      gamePhase: GamePhase.Finished,
    };
  }

  return state;
}
