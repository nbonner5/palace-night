import { Card, Rank, Suit, RNG } from '../types';

const SUITS: Suit[] = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];

const RANKS: Rank[] = [
  Rank.Two,
  Rank.Three,
  Rank.Four,
  Rank.Five,
  Rank.Six,
  Rank.Seven,
  Rank.Eight,
  Rank.Nine,
  Rank.Ten,
  Rank.Jack,
  Rank.Queen,
  Rank.King,
  Rank.Ace,
];

export function createDeck(): Card[] {
  const cards: Card[] = [];

  // Two standard decks
  for (let copy = 0; copy < 2; copy++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({
          id: `${suit}${rank}-${copy}`,
          rank,
          suit,
        });
      }
    }
  }

  // 4 Jokers
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `JK-${i}`,
      rank: Rank.Joker,
      suit: null,
    });
  }

  return cards;
}

export function shuffleDeck(cards: readonly Card[], rng?: RNG): Card[] {
  const result = [...cards];
  const random = rng ?? Math.random;

  // Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }

  return result;
}

export interface DealResult {
  readonly hands: [Card[], Card[], Card[], Card[]];
  readonly faceDowns: [Card[], Card[], Card[], Card[]];
  readonly drawPile: Card[];
}

export function dealCards(deck: readonly Card[]): DealResult {
  const cards = [...deck];

  // Deal 3 face-down per player (12 cards)
  const faceDowns: [Card[], Card[], Card[], Card[]] = [[], [], [], []];
  for (let round = 0; round < 3; round++) {
    for (let p = 0; p < 4; p++) {
      faceDowns[p]!.push(cards.shift()!);
    }
  }

  // Deal 6 to each player's hand (24 cards)
  const hands: [Card[], Card[], Card[], Card[]] = [[], [], [], []];
  for (let round = 0; round < 6; round++) {
    for (let p = 0; p < 4; p++) {
      hands[p]!.push(cards.shift()!);
    }
  }

  return {
    hands,
    faceDowns,
    drawPile: cards, // remaining 72
  };
}
