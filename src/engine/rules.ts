import { Card, PlayerState, PlayerPhase, Rank } from '../types';

export function isSpecialCard(card: Card): boolean {
  return card.rank === Rank.Two || card.rank === Rank.Ten || card.rank === Rank.Joker;
}

export function canPlayOn(card: Card, pileTopCard?: Card): boolean {
  // Empty pile → any card
  if (!pileTopCard) return true;

  // Special cards can always be played
  if (isSpecialCard(card)) return true;

  // 2 or Joker on top → any card (their numeric values are below 3)
  if (pileTopCard.rank === Rank.Two || pileTopCard.rank === Rank.Joker) return true;

  // Normal comparison: card rank >= pile top rank
  return card.rank >= pileTopCard.rank;
}

export function getPlayableZone(player: PlayerState): readonly Card[] {
  switch (player.phase) {
    case PlayerPhase.HandAndDraw:
    case PlayerPhase.HandOnly:
      return player.hand;
    case PlayerPhase.FaceUp:
      return player.faceUp;
    case PlayerPhase.FaceDown:
      return player.faceDown;
  }
}

export function getPlayableCards(
  player: PlayerState,
  pile: readonly Card[]
): Card[] {
  if (player.phase === PlayerPhase.FaceDown) {
    // Can't see face-down cards — no filtering
    return [];
  }

  const zone = getPlayableZone(player);
  const topCard = pile.length > 0 ? pile[pile.length - 1] : undefined;

  return zone.filter((card) => canPlayOn(card, topCard));
}

export function consecutiveSameRankOnTop(
  pile: readonly Card[],
  rank: Rank
): number {
  let count = 0;
  for (let i = pile.length - 1; i >= 0; i--) {
    const card = pile[i]!;
    if (card.rank === rank) {
      count++;
    } else {
      // 2s and Jokers break the chain
      break;
    }
  }
  return count;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly reason?: string;
}

export function validatePlay(
  cards: readonly Card[],
  player: PlayerState,
  pile: readonly Card[],
): ValidationResult {
  if (cards.length === 0) {
    return { valid: false, reason: 'Must play at least one card' };
  }

  // All cards must be same rank
  const rank = cards[0]!.rank;
  if (!cards.every((c) => c.rank === rank)) {
    return { valid: false, reason: 'All cards must be the same rank' };
  }

  // Cards must exist in playable zone
  const zone = getPlayableZone(player);
  for (const card of cards) {
    if (!zone.some((z) => z.id === card.id)) {
      return { valid: false, reason: `Card ${card.id} not in playable zone` };
    }
  }

  // Must be playable on pile top
  const topCard = pile.length > 0 ? pile[pile.length - 1] : undefined;
  if (!canPlayOn(cards[0]!, topCard)) {
    return { valid: false, reason: 'Card cannot be played on current pile' };
  }

  // 4-of-a-kind limit: if N of this rank on pile top, can only play (4 - N)
  const onPile = consecutiveSameRankOnTop(pile, rank);
  const maxPlayable = 4 - onPile;
  if (maxPlayable <= 0) {
    return { valid: false, reason: 'Already 4 of this rank on pile' };
  }
  if (cards.length > maxPlayable) {
    return {
      valid: false,
      reason: `Can only play ${maxPlayable} more of rank ${rank} (${onPile} already on pile)`,
    };
  }

  return { valid: true };
}

export function findLowestCard(
  players: readonly PlayerState[]
): { playerIndex: number; card: Card } | null {
  let lowest: { playerIndex: number; card: Card } | null = null;

  for (let i = 0; i < players.length; i++) {
    const player = players[i]!;
    for (const card of player.hand) {
      // Exclude specials (2, 10, Joker) from first-player determination
      if (isSpecialCard(card)) continue;

      if (!lowest || card.rank < lowest.card.rank) {
        lowest = { playerIndex: i, card };
      } else if (
        card.rank === lowest.card.rank &&
        i < lowest.playerIndex
      ) {
        // Deterministic tiebreak: lower player index wins
        lowest = { playerIndex: i, card };
      }
    }
  }

  return lowest;
}
