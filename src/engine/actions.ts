import {
  Action,
  ActionResult,
  Card,
  GameEvent,
  GamePhase,
  GameState,
  PlayerPhase,
  PlayerState,
} from '../types';
import { checkBlowup, executeBlowup } from './blowup';
import { canJumpIn, getJumpInWindow } from './jumpIn';
import { validatePlay, getPlayableZone, canPlayOn } from './rules';
import { drawCards, checkPhaseTransition, advanceTurn, checkWin } from './turnFlow';
import { findLowestCard } from './rules';

function updatePlayer(
  state: GameState,
  playerIndex: number,
  updates: Partial<PlayerState>
): GameState {
  const newPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, ...updates } : p
  );
  return { ...state, players: newPlayers };
}

function removeCards(cards: readonly Card[], idsToRemove: readonly string[]): Card[] {
  return cards.filter((c) => !idsToRemove.includes(c.id));
}

function handleChooseFaceUp(state: GameState, action: Extract<Action, { type: 'CHOOSE_FACE_UP' }>): ActionResult {
  if (state.gamePhase !== GamePhase.Setup) {
    throw new Error('CHOOSE_FACE_UP only valid during Setup');
  }

  const player = state.players[action.playerIndex]!;

  if (action.cardIds.length !== 3) {
    throw new Error('Must choose exactly 3 cards for face-up');
  }

  // Cards must be in hand
  const chosenCards: Card[] = [];
  for (const id of action.cardIds) {
    const card = player.hand.find((c) => c.id === id);
    if (!card) throw new Error(`Card ${id} not in hand`);
    chosenCards.push(card);
  }

  const newHand = removeCards(player.hand, action.cardIds);
  const newFaceUp = [...player.faceUp, ...chosenCards];

  let newState = updatePlayer(state, action.playerIndex, {
    hand: newHand,
    faceUp: newFaceUp,
  });

  const remaining = state.setupChoicesRemaining - 1;
  newState = { ...newState, setupChoicesRemaining: remaining };

  const events: GameEvent[] = [];

  // Move to next player for setup, or transition to Playing
  if (remaining <= 0) {
    // All players have chosen — transition to Playing
    const lowest = findLowestCard(newState.players);
    const firstPlayer = lowest?.playerIndex ?? 0;

    newState = {
      ...newState,
      gamePhase: GamePhase.Playing,
      currentPlayerIndex: firstPlayer,
    };
  } else {
    // Advance to next player for setup
    newState = {
      ...newState,
      currentPlayerIndex: (action.playerIndex + 1) % state.players.length,
    };
  }

  return { state: newState, events };
}

function handlePlayCards(state: GameState, action: Extract<Action, { type: 'PLAY_CARDS' }>): ActionResult {
  if (state.gamePhase !== GamePhase.Playing) {
    throw new Error('PLAY_CARDS only valid during Playing');
  }

  if (action.playerIndex !== state.currentPlayerIndex && !state.mustPlayAgain) {
    throw new Error('Not this player\'s turn');
  }

  const player = state.players[action.playerIndex]!;

  // Get the actual card objects
  const zone = getPlayableZone(player);
  const playedCards: Card[] = [];
  for (const id of action.cardIds) {
    const card = zone.find((c) => c.id === id);
    if (!card) throw new Error(`Card ${id} not found in playable zone`);
    playedCards.push(card);
  }

  // Validate
  const validation = validatePlay(playedCards, player, state.pile);
  if (!validation.valid) {
    throw new Error(`Invalid play: ${validation.reason}`);
  }

  const events: GameEvent[] = [];

  // Remove cards from appropriate zone
  let playerUpdates: Partial<PlayerState> = {};
  switch (player.phase) {
    case PlayerPhase.HandAndDraw:
    case PlayerPhase.HandOnly:
      playerUpdates = { hand: removeCards(player.hand, action.cardIds) };
      break;
    case PlayerPhase.FaceUp:
      playerUpdates = { faceUp: removeCards(player.faceUp, action.cardIds) };
      break;
    default:
      throw new Error('Cannot play cards from FaceDown phase');
  }

  // Add to pile
  const newPile = [...state.pile, ...playedCards];
  let newState = updatePlayer(state, action.playerIndex, playerUpdates);
  newState = { ...newState, pile: newPile };

  events.push({
    type: 'CARDS_PLAYED',
    playerIndex: action.playerIndex,
    cards: playedCards,
  });

  // Check blowup
  const blowupResult = checkBlowup(newPile);
  if (blowupResult.blowup) {
    newState = executeBlowup(newState);
    events.push({
      type: 'BLOWUP',
      reason: blowupResult.reason!,
      cardCount: newPile.length,
    });
    // mustPlayAgain is already set by executeBlowup
  } else if (playedCards[0]!.rank === 2 || playedCards[0]!.rank === 0) {
    // Special cards (2/Joker): must play again, no jump-in window
    newState = {
      ...newState,
      mustPlayAgain: true,
      jumpInWindow: null,
    };
  } else {
    // Normal play
    newState = {
      ...newState,
      mustPlayAgain: false,
      jumpInWindow: getJumpInWindow(playedCards, action.playerIndex),
    };
  }

  // Draw cards
  const drawResult = drawCards(newState, action.playerIndex);
  newState = drawResult.state;
  events.push(...drawResult.events);

  // Phase transition
  const phaseResult = checkPhaseTransition(newState, action.playerIndex);
  newState = phaseResult.state;
  events.push(...phaseResult.events);

  // Win check
  newState = checkWin(newState, action.playerIndex);
  if (newState.winnerId !== null) {
    events.push({ type: 'GAME_WON', playerIndex: action.playerIndex });
    return { state: newState, events };
  }

  // Advance turn if not must play again
  if (!newState.mustPlayAgain) {
    const turnResult = advanceTurn(newState);
    newState = turnResult.state;
    events.push(...turnResult.events);
  }

  return { state: newState, events };
}

function handleFlipFaceDown(state: GameState, action: Extract<Action, { type: 'FLIP_FACE_DOWN' }>): ActionResult {
  if (state.gamePhase !== GamePhase.Playing) {
    throw new Error('FLIP_FACE_DOWN only valid during Playing');
  }

  const player = state.players[action.playerIndex]!;
  if (player.phase !== PlayerPhase.FaceDown) {
    throw new Error('FLIP_FACE_DOWN only valid in FaceDown phase');
  }

  if (action.slotIndex < 0 || action.slotIndex >= player.faceDown.length) {
    throw new Error(`Invalid slot index: ${action.slotIndex}`);
  }

  const flippedCard = player.faceDown[action.slotIndex]!;
  const events: GameEvent[] = [];

  const topCard = state.pile.length > 0 ? state.pile[state.pile.length - 1] : undefined;
  const playable = canPlayOn(flippedCard, topCard);

  events.push({
    type: 'FACE_DOWN_FLIPPED',
    playerIndex: action.playerIndex,
    card: flippedCard,
    playable,
  });

  // Remove from faceDown
  const newFaceDown = player.faceDown.filter((_, i) => i !== action.slotIndex);

  if (playable) {
    // Add to pile
    const newPile = [...state.pile, flippedCard];
    let newState = updatePlayer(state, action.playerIndex, { faceDown: newFaceDown });
    newState = { ...newState, pile: newPile };

    events.push({
      type: 'CARDS_PLAYED',
      playerIndex: action.playerIndex,
      cards: [flippedCard],
    });

    // Check blowup
    const blowupResult = checkBlowup(newPile);
    if (blowupResult.blowup) {
      newState = executeBlowup(newState);
      events.push({
        type: 'BLOWUP',
        reason: blowupResult.reason!,
        cardCount: newPile.length,
      });
    } else if (flippedCard.rank === 2 || flippedCard.rank === 0) {
      newState = { ...newState, mustPlayAgain: true, jumpInWindow: null };
    } else {
      newState = {
        ...newState,
        mustPlayAgain: false,
        jumpInWindow: getJumpInWindow([flippedCard], action.playerIndex),
      };
    }

    // Phase transition
    const phaseResult = checkPhaseTransition(newState, action.playerIndex);
    newState = phaseResult.state;
    events.push(...phaseResult.events);

    // Win check
    newState = checkWin(newState, action.playerIndex);
    if (newState.winnerId !== null) {
      events.push({ type: 'GAME_WON', playerIndex: action.playerIndex });
      return { state: newState, events };
    }

    // Advance turn if not must play again
    if (!newState.mustPlayAgain) {
      const turnResult = advanceTurn(newState);
      newState = turnResult.state;
      events.push(...turnResult.events);
    }

    return { state: newState, events };
  } else {
    // NOT playable — pick up pile + flipped card → hand, regress to HandOnly
    const pileCards = [...state.pile, flippedCard];

    let newState = updatePlayer(state, action.playerIndex, {
      faceDown: newFaceDown,
      hand: [...player.hand, ...pileCards],
      phase: PlayerPhase.HandOnly,
    });
    newState = { ...newState, pile: [], jumpInWindow: null };

    events.push({
      type: 'PILE_PICKED_UP',
      playerIndex: action.playerIndex,
      cardCount: pileCards.length,
    });

    // Advance turn
    const turnResult = advanceTurn(newState);
    newState = turnResult.state;
    events.push(...turnResult.events);

    return { state: newState, events };
  }
}

function handlePickUpPile(state: GameState, action: Extract<Action, { type: 'PICK_UP_PILE' }>): ActionResult {
  if (state.gamePhase !== GamePhase.Playing) {
    throw new Error('PICK_UP_PILE only valid during Playing');
  }

  if (state.mustPlayAgain) {
    throw new Error('Cannot pick up pile during must-play-again');
  }

  const player = state.players[action.playerIndex]!;
  const events: GameEvent[] = [];

  // Move pile to hand
  const pileCards = [...state.pile];

  // Determine new phase — regress to HandOnly if was in FaceUp or FaceDown
  let newPhase = player.phase;
  if (
    player.phase === PlayerPhase.FaceUp ||
    player.phase === PlayerPhase.FaceDown
  ) {
    events.push({
      type: 'PHASE_CHANGE',
      playerIndex: action.playerIndex,
      from: player.phase,
      to: PlayerPhase.HandOnly,
    });
    newPhase = PlayerPhase.HandOnly;
  }

  let newState = updatePlayer(state, action.playerIndex, {
    hand: [...player.hand, ...pileCards],
    phase: newPhase,
  });
  newState = { ...newState, pile: [], jumpInWindow: null };

  events.push({
    type: 'PILE_PICKED_UP',
    playerIndex: action.playerIndex,
    cardCount: pileCards.length,
  });

  // Advance turn
  const turnResult = advanceTurn(newState);
  newState = turnResult.state;
  events.push(...turnResult.events);

  return { state: newState, events };
}

function handleJumpIn(state: GameState, action: Extract<Action, { type: 'JUMP_IN' }>): ActionResult {
  if (!canJumpIn(state, action.playerIndex, action.cardIds)) {
    throw new Error('Invalid jump-in');
  }

  const player = state.players[action.playerIndex]!;
  const events: GameEvent[] = [];

  // Get the card objects
  const jumpCards: Card[] = [];
  for (const id of action.cardIds) {
    const card = player.hand.find((c) => c.id === id);
    if (!card) throw new Error(`Card ${id} not found in hand`);
    jumpCards.push(card);
  }

  // Remove from hand, add to pile
  const newHand = removeCards(player.hand, action.cardIds);
  const newPile = [...state.pile, ...jumpCards];

  let newState = updatePlayer(state, action.playerIndex, { hand: newHand });
  newState = {
    ...newState,
    pile: newPile,
    currentPlayerIndex: action.playerIndex,
  };

  events.push({
    type: 'JUMP_IN',
    playerIndex: action.playerIndex,
    cards: jumpCards,
  });

  // Check blowup (4-of-a-kind from jump-in)
  const blowupResult = checkBlowup(newPile);
  if (blowupResult.blowup) {
    newState = executeBlowup(newState);
    events.push({
      type: 'BLOWUP',
      reason: blowupResult.reason!,
      cardCount: newPile.length,
    });
  } else {
    newState = {
      ...newState,
      mustPlayAgain: false,
      jumpInWindow: getJumpInWindow(jumpCards, action.playerIndex),
    };
  }

  // Draw
  const drawResult = drawCards(newState, action.playerIndex);
  newState = drawResult.state;
  events.push(...drawResult.events);

  // Phase transition
  const phaseResult = checkPhaseTransition(newState, action.playerIndex);
  newState = phaseResult.state;
  events.push(...phaseResult.events);

  // Win check
  newState = checkWin(newState, action.playerIndex);
  if (newState.winnerId !== null) {
    events.push({ type: 'GAME_WON', playerIndex: action.playerIndex });
    return { state: newState, events };
  }

  // Advance turn if not must play again
  if (!newState.mustPlayAgain) {
    const turnResult = advanceTurn(newState);
    newState = turnResult.state;
    events.push(...turnResult.events);
  }

  return { state: newState, events };
}

export function processAction(state: GameState, action: Action): ActionResult {
  switch (action.type) {
    case 'CHOOSE_FACE_UP':
      return handleChooseFaceUp(state, action);
    case 'PLAY_CARDS':
      return handlePlayCards(state, action);
    case 'FLIP_FACE_DOWN':
      return handleFlipFaceDown(state, action);
    case 'PICK_UP_PILE':
      return handlePickUpPile(state, action);
    case 'JUMP_IN':
      return handleJumpIn(state, action);
  }
}
