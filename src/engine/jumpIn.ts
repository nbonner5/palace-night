import { Card, GameState, JumpInWindow, PlayerPhase, Rank } from '../types';

export function canJumpIn(
  state: GameState,
  playerIndex: number,
  cardIds: readonly string[]
): boolean {
  // Must have active jump-in window
  if (!state.jumpInWindow) return false;

  const player = state.players[playerIndex]!;

  // FaceUp can't jump in; FaceDown can only jump in when they have a card in hand
  if (player.phase === PlayerPhase.FaceUp) return false;
  if (player.phase === PlayerPhase.FaceDown && player.hand.length === 0) return false;

  // Cards must exist in hand
  for (const id of cardIds) {
    if (!player.hand.some((c) => c.id === id)) return false;
  }

  // Cards must match jumpInWindow rank
  const matchingCards = player.hand.filter((c) => cardIds.includes(c.id));
  if (matchingCards.length !== cardIds.length) return false;

  if (!matchingCards.every((c) => c.rank === state.jumpInWindow!.cardRank)) {
    return false;
  }

  // Can't jump in on specials (2 or Joker)
  if (
    state.jumpInWindow.cardRank === Rank.Two ||
    state.jumpInWindow.cardRank === Rank.Joker
  ) {
    return false;
  }

  return true;
}

export function getJumpInWindow(
  lastPlayedCards: readonly Card[],
  playerIndex: number
): JumpInWindow | null {
  if (lastPlayedCards.length === 0) return null;

  const rank = lastPlayedCards[0]!.rank;

  // No jump-in window for specials
  if (rank === Rank.Two || rank === Rank.Ten || rank === Rank.Joker) {
    return null;
  }

  return { cardRank: rank, playedByIndex: playerIndex };
}
