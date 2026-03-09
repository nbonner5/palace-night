import { Card, GameState, Rank } from '../types';

export interface BlowupResult {
  readonly blowup: boolean;
  readonly reason?: 'TEN' | 'FOUR_OF_A_KIND';
}

export function checkBlowup(pile: readonly Card[]): BlowupResult {
  if (pile.length === 0) {
    return { blowup: false };
  }

  const topCard = pile[pile.length - 1]!;

  // 10 on top → TEN blowup
  if (topCard.rank === Rank.Ten) {
    return { blowup: true, reason: 'TEN' };
  }

  // Check for 4+ consecutive same rank on top (2s/Jokers break chain)
  if (pile.length >= 4) {
    const rank = topCard.rank;
    let count = 0;

    for (let i = pile.length - 1; i >= 0; i--) {
      const card = pile[i]!;
      if (card.rank === rank) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 4) {
      return { blowup: true, reason: 'FOUR_OF_A_KIND' };
    }
  }

  return { blowup: false };
}

export function executeBlowup(state: GameState): GameState {
  return {
    ...state,
    burnPile: [...state.burnPile, ...state.pile],
    pile: [],
    mustPlayAgain: true,
    jumpInWindow: null,
  };
}
