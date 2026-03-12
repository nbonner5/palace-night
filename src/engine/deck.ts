import { Card, Rank, Suit, RNG, GameConfig, DEFAULT_CONFIG } from '../types';

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

export function createDeck(config: GameConfig = DEFAULT_CONFIG): Card[] {
  const cards: Card[] = [];

  for (let copy = 0; copy < config.deckCount; copy++) {
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

  if (config.includeJokers) {
    const jokerCount = config.deckCount * 2;
    for (let i = 0; i < jokerCount; i++) {
      cards.push({
        id: `JK-${i}`,
        rank: Rank.Joker,
        suit: null,
      });
    }
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
  readonly hands: Card[][];
  readonly faceDowns: Card[][];
  readonly drawPile: Card[];
}

export function dealCards(deck: readonly Card[], playerCount: number = 4): DealResult {
  const cards = [...deck];

  const faceDowns: Card[][] = Array.from({ length: playerCount }, () => []);
  for (let round = 0; round < 3; round++) {
    for (let p = 0; p < playerCount; p++) {
      faceDowns[p]!.push(cards.shift()!);
    }
  }

  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  for (let round = 0; round < 6; round++) {
    for (let p = 0; p < playerCount; p++) {
      hands[p]!.push(cards.shift()!);
    }
  }

  return {
    hands,
    faceDowns,
    drawPile: cards,
  };
}

export function validateConfig(config: GameConfig): { valid: boolean; reason?: string } {
  const playerCount = config.cpuCount + 1;
  const cardsPerDeck = 52;
  const totalCards = config.deckCount * cardsPerDeck + (config.includeJokers ? config.deckCount * 2 : 0);
  const cardsNeeded = playerCount * 9;

  if (cardsNeeded > totalCards) {
    return {
      valid: false,
      reason: `${playerCount} players need ${cardsNeeded} cards but only ${totalCards} available`,
    };
  }

  return { valid: true };
}
