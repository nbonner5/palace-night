import {
  Action,
  GamePhase,
  GameState,
  JumpInAction,
  PlayerPhase,
  Rank,
} from '../types';
import { autoChooseFaceUp } from './gameState';
import {
  canPlayOn,
  getPlayableCards,
  isSpecialCard,
  consecutiveSameRankOnTop,
} from './rules';

export function decideCpuAction(state: GameState, playerIndex: number): Action {
  // Setup phase: choose face-up
  if (state.gamePhase === GamePhase.Setup) {
    return autoChooseFaceUp(state, playerIndex);
  }

  const player = state.players[playerIndex]!;

  // FaceDown phase: always pick first slot (cards are already shuffled)
  if (player.phase === PlayerPhase.FaceDown) {
    const slotIndex = 0;
    return {
      type: 'FLIP_FACE_DOWN',
      playerIndex,
      slotIndex,
    };
  }

  // Get playable cards
  const playable = getPlayableCards(player, state.pile);

  if (playable.length === 0) {
    // Nothing playable — pick up pile
    return {
      type: 'PICK_UP_PILE',
      playerIndex,
    };
  }

  // Group by rank
  const groups = new Map<Rank, string[]>();
  for (const card of playable) {
    const existing = groups.get(card.rank) ?? [];
    existing.push(card.id);
    groups.set(card.rank, existing);
  }

  // Decide which rank to play
  let chosenRank: Rank | null = null;

  // Exception: play 10 when pile > 5 cards
  if (groups.has(Rank.Ten) && state.pile.length > 5) {
    chosenRank = Rank.Ten;
  }

  if (chosenRank === null) {
    // Play lowest non-special rank first
    let lowestRank: Rank | null = null;
    for (const rank of groups.keys()) {
      if (isSpecialCard({ id: '', rank, suit: null })) continue;
      if (lowestRank === null || rank < lowestRank) {
        lowestRank = rank;
      }
    }

    if (lowestRank !== null) {
      chosenRank = lowestRank;
    }
  }

  if (chosenRank === null) {
    // Only specials available — play them (prefer 2 over Joker over 10)
    if (groups.has(Rank.Two)) {
      chosenRank = Rank.Two;
    } else if (groups.has(Rank.Joker)) {
      chosenRank = Rank.Joker;
    } else if (groups.has(Rank.Ten)) {
      chosenRank = Rank.Ten;
    }
  }

  if (chosenRank === null) {
    // Fallback — shouldn't happen
    return { type: 'PICK_UP_PILE', playerIndex };
  }

  // Get card IDs for chosen rank, respecting 4-of-a-kind limit
  const onPile = consecutiveSameRankOnTop(state.pile, chosenRank);
  const maxPlayable = 4 - onPile;
  const cardIds = groups.get(chosenRank)!.slice(0, maxPlayable);

  return {
    type: 'PLAY_CARDS',
    playerIndex,
    cardIds,
  };
}

export function decideCpuJumpIn(
  state: GameState,
  playerIndex: number
): JumpInAction | null {
  if (!state.jumpInWindow) return null;

  const player = state.players[playerIndex]!;

  // Only jump in from hand phases
  if (
    player.phase !== PlayerPhase.HandAndDraw &&
    player.phase !== PlayerPhase.HandOnly
  ) {
    return null;
  }

  // Can't jump in on own play
  if (state.jumpInWindow.playedByIndex === playerIndex) return null;

  // Can't jump in on specials
  const targetRank = state.jumpInWindow.cardRank;
  if (targetRank === Rank.Two || targetRank === Rank.Joker) return null;

  // Find matching cards
  const matching = player.hand.filter((c) => c.rank === targetRank);
  if (matching.length === 0) return null;

  // Check if jumping in would trigger 4-of-a-kind
  const onPile = consecutiveSameRankOnTop(state.pile, targetRank);
  const wouldComplete = onPile + matching.length >= 4;

  // Only jump in if 2+ matching cards or would trigger 4-of-a-kind
  if (matching.length >= 2 || wouldComplete) {
    const maxPlayable = 4 - onPile;
    const cardIds = matching.slice(0, maxPlayable).map((c) => c.id);
    return {
      type: 'JUMP_IN',
      playerIndex,
      cardIds,
    };
  }

  return null;
}
