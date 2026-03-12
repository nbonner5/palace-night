import { createDeck, shuffleDeck, dealCards } from '../../src/engine/deck';
import { Rank, Suit } from '../../src/types';

describe('createDeck', () => {
  const deck = createDeck();

  it('creates 108 cards', () => {
    expect(deck).toHaveLength(108);
  });

  it('has 4 jokers', () => {
    const jokers = deck.filter((c) => c.rank === Rank.Joker);
    expect(jokers).toHaveLength(4);
    expect(jokers.every((j) => j.suit === null)).toBe(true);
  });

  it('has 2 of each rank/suit combo', () => {
    const suits = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];
    const ranks = [
      Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six,
      Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten,
      Rank.Jack, Rank.Queen, Rank.King, Rank.Ace,
    ];

    for (const suit of suits) {
      for (const rank of ranks) {
        const matches = deck.filter((c) => c.rank === rank && c.suit === suit);
        expect(matches).toHaveLength(2);
      }
    }
  });

  it('has unique IDs', () => {
    const ids = deck.map((c) => c.id);
    expect(new Set(ids).size).toBe(108);
  });
});

describe('shuffleDeck', () => {
  it('does not mutate input', () => {
    const deck = createDeck();
    const original = [...deck];
    shuffleDeck(deck);
    expect(deck).toEqual(original);
  });

  it('is deterministic with same RNG', () => {
    const deck = createDeck();
    const makeRng = () => {
      let s = 42;
      return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    const shuffled1 = shuffleDeck(deck, makeRng());
    const shuffled2 = shuffleDeck(deck, makeRng());
    expect(shuffled1).toEqual(shuffled2);
  });

  it('produces a different order', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    // Very unlikely to be same order (1 in 108! chance)
    const sameOrder = deck.every((c, i) => c.id === shuffled[i]?.id);
    expect(sameOrder).toBe(false);
  });
});

describe('dealCards', () => {
  const deck = createDeck();
  const result = dealCards(deck, 4);

  it('gives 3 face-down per player', () => {
    for (const fd of result.faceDowns) {
      expect(fd).toHaveLength(3);
    }
  });

  it('gives 6 hand cards per player', () => {
    for (const hand of result.hands) {
      expect(hand).toHaveLength(6);
    }
  });

  it('has 72 in draw pile', () => {
    expect(result.drawPile).toHaveLength(72);
  });

  it('accounts for all 108 cards with no duplicates', () => {
    const allCards = [
      ...result.drawPile,
      ...result.hands.flat(),
      ...result.faceDowns.flat(),
    ];
    expect(allCards).toHaveLength(108);
    const ids = allCards.map((c) => c.id);
    expect(new Set(ids).size).toBe(108);
  });
});
