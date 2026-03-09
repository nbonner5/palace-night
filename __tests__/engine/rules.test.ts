import { canPlayOn, validatePlay, findLowestCard, isSpecialCard, consecutiveSameRankOnTop, getPlayableCards } from '../../src/engine/rules';
import { Rank, Suit, PlayerPhase } from '../../src/types';
import { card, joker, ten, two } from '../helpers/cardFactory';
import { buildPlayer } from '../helpers/stateBuilder';

beforeEach(() => {
  // Reset card factory counter
  require('../helpers/cardFactory').resetIdCounter();
});

describe('isSpecialCard', () => {
  it('returns true for 2, 10, Joker', () => {
    expect(isSpecialCard(two())).toBe(true);
    expect(isSpecialCard(ten())).toBe(true);
    expect(isSpecialCard(joker())).toBe(true);
  });

  it('returns false for normal cards', () => {
    expect(isSpecialCard(card(Rank.Three))).toBe(false);
    expect(isSpecialCard(card(Rank.Ace))).toBe(false);
    expect(isSpecialCard(card(Rank.Seven))).toBe(false);
  });
});

describe('canPlayOn', () => {
  it('allows any card on empty pile', () => {
    expect(canPlayOn(card(Rank.Three))).toBe(true);
    expect(canPlayOn(card(Rank.Ace))).toBe(true);
    expect(canPlayOn(joker())).toBe(true);
  });

  it('allows higher or equal rank', () => {
    const topCard = card(Rank.Seven, Suit.Hearts, 'top');
    expect(canPlayOn(card(Rank.Seven), topCard)).toBe(true);
    expect(canPlayOn(card(Rank.Eight), topCard)).toBe(true);
    expect(canPlayOn(card(Rank.Ace), topCard)).toBe(true);
  });

  it('rejects lower rank', () => {
    const topCard = card(Rank.Seven, Suit.Hearts, 'top');
    expect(canPlayOn(card(Rank.Three), topCard)).toBe(false);
    expect(canPlayOn(card(Rank.Six), topCard)).toBe(false);
  });

  it('allows specials on anything', () => {
    const topCard = card(Rank.Ace, Suit.Hearts, 'top');
    expect(canPlayOn(two(), topCard)).toBe(true);
    expect(canPlayOn(ten(), topCard)).toBe(true);
    expect(canPlayOn(joker(), topCard)).toBe(true);
  });

  it('allows any card on 2 or Joker', () => {
    const twoTop = two(Suit.Hearts, 'top-2');
    expect(canPlayOn(card(Rank.Three), twoTop)).toBe(true);

    const jokerTop = joker('top-jk');
    expect(canPlayOn(card(Rank.Three), jokerTop)).toBe(true);
  });
});

describe('validatePlay', () => {
  it('accepts valid single card play', () => {
    const c = card(Rank.Seven, Suit.Hearts, 'c1');
    const player = buildPlayer(0, {
      hand: [c, card(Rank.Five, Suit.Diamonds, 'c2')],
      phase: PlayerPhase.HandAndDraw,
    });
    const pile = [card(Rank.Five, Suit.Clubs, 'pile1')];

    const result = validatePlay([c], player, pile);
    expect(result.valid).toBe(true);
  });

  it('accepts valid multi-card play', () => {
    const c1 = card(Rank.Seven, Suit.Hearts, 'c1');
    const c2 = card(Rank.Seven, Suit.Diamonds, 'c2');
    const player = buildPlayer(0, {
      hand: [c1, c2],
      phase: PlayerPhase.HandAndDraw,
    });

    const result = validatePlay([c1, c2], player, []);
    expect(result.valid).toBe(true);
  });

  it('rejects mixed ranks', () => {
    const c1 = card(Rank.Seven, Suit.Hearts, 'c1');
    const c2 = card(Rank.Eight, Suit.Diamonds, 'c2');
    const player = buildPlayer(0, {
      hand: [c1, c2],
      phase: PlayerPhase.HandAndDraw,
    });

    const result = validatePlay([c1, c2], player, []);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/same rank/i);
  });

  it('rejects card not in zone', () => {
    const c = card(Rank.Seven, Suit.Hearts, 'not-in-hand');
    const player = buildPlayer(0, {
      hand: [card(Rank.Five, Suit.Diamonds, 'other')],
      phase: PlayerPhase.HandAndDraw,
    });

    const result = validatePlay([c], player, []);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/not in playable zone/i);
  });

  it('rejects too-low rank', () => {
    const c = card(Rank.Three, Suit.Hearts, 'c1');
    const player = buildPlayer(0, {
      hand: [c],
      phase: PlayerPhase.HandAndDraw,
    });
    const pile = [card(Rank.King, Suit.Clubs, 'pile1')];

    const result = validatePlay([c], player, pile);
    expect(result.valid).toBe(false);
  });

  it('enforces 4-of-a-kind limit: 3 on pile allows only 1 more', () => {
    const c1 = card(Rank.Seven, Suit.Hearts, 'c1');
    const c2 = card(Rank.Seven, Suit.Diamonds, 'c2');
    const player = buildPlayer(0, {
      hand: [c1, c2],
      phase: PlayerPhase.HandAndDraw,
    });
    const pile = [
      card(Rank.Seven, Suit.Clubs, 'p1'),
      card(Rank.Seven, Suit.Spades, 'p2'),
      card(Rank.Seven, Suit.Hearts, 'p3'),
    ];

    // Playing 2 when 3 on pile → invalid
    const result = validatePlay([c1, c2], player, pile);
    expect(result.valid).toBe(false);

    // Playing 1 → valid
    const result2 = validatePlay([c1], player, pile);
    expect(result2.valid).toBe(true);
  });

  it('rejects empty cards array', () => {
    const player = buildPlayer(0, {
      hand: [card(Rank.Five)],
      phase: PlayerPhase.HandAndDraw,
    });
    const result = validatePlay([], player, []);
    expect(result.valid).toBe(false);
  });
});

describe('consecutiveSameRankOnTop', () => {
  it('counts consecutive same rank from top', () => {
    const pile = [
      card(Rank.Five, Suit.Hearts, 'p1'),
      card(Rank.Seven, Suit.Hearts, 'p2'),
      card(Rank.Seven, Suit.Diamonds, 'p3'),
      card(Rank.Seven, Suit.Clubs, 'p4'),
    ];
    expect(consecutiveSameRankOnTop(pile, Rank.Seven)).toBe(3);
  });

  it('stops at different rank', () => {
    const pile = [
      card(Rank.Seven, Suit.Hearts, 'p1'),
      card(Rank.Five, Suit.Hearts, 'p2'),
      card(Rank.Seven, Suit.Diamonds, 'p3'),
    ];
    expect(consecutiveSameRankOnTop(pile, Rank.Seven)).toBe(1);
  });

  it('returns 0 for empty pile', () => {
    expect(consecutiveSameRankOnTop([], Rank.Seven)).toBe(0);
  });
});

describe('findLowestCard', () => {
  it('finds lowest non-special card across players', () => {
    const players = [
      buildPlayer(0, { hand: [card(Rank.Five, Suit.Hearts, 'p0c')] }),
      buildPlayer(1, { hand: [card(Rank.Three, Suit.Hearts, 'p1c')] }),
      buildPlayer(2, { hand: [card(Rank.Seven, Suit.Hearts, 'p2c')] }),
      buildPlayer(3, { hand: [card(Rank.Four, Suit.Hearts, 'p3c')] }),
    ];

    const result = findLowestCard(players);
    expect(result).not.toBeNull();
    expect(result!.playerIndex).toBe(1);
    expect(result!.card.rank).toBe(Rank.Three);
  });

  it('excludes specials', () => {
    const players = [
      buildPlayer(0, { hand: [two(Suit.Hearts, 'p0c')] }),
      buildPlayer(1, { hand: [card(Rank.Five, Suit.Hearts, 'p1c')] }),
      buildPlayer(2, { hand: [joker('p2c')] }),
      buildPlayer(3, { hand: [ten(Suit.Hearts, 'p3c')] }),
    ];

    const result = findLowestCard(players);
    expect(result!.playerIndex).toBe(1);
  });

  it('uses lower player index as tiebreak', () => {
    const players = [
      buildPlayer(0, { hand: [card(Rank.Three, Suit.Hearts, 'p0c')] }),
      buildPlayer(1, { hand: [card(Rank.Three, Suit.Diamonds, 'p1c')] }),
      buildPlayer(2, { hand: [card(Rank.Seven, Suit.Hearts, 'p2c')] }),
      buildPlayer(3, { hand: [card(Rank.Seven, Suit.Hearts, 'p3c')] }),
    ];

    const result = findLowestCard(players);
    expect(result!.playerIndex).toBe(0);
  });
});

describe('getPlayableCards', () => {
  it('returns empty for FaceDown phase', () => {
    const player = buildPlayer(0, {
      faceDown: [card(Rank.Ace, Suit.Hearts, 'fd1')],
      phase: PlayerPhase.FaceDown,
    });
    expect(getPlayableCards(player, [])).toEqual([]);
  });

  it('filters by canPlayOn', () => {
    const c1 = card(Rank.Three, Suit.Hearts, 'c1');
    const c2 = card(Rank.King, Suit.Hearts, 'c2');
    const player = buildPlayer(0, {
      hand: [c1, c2],
      phase: PlayerPhase.HandOnly,
    });
    const pile = [card(Rank.Seven, Suit.Clubs, 'pile1')];

    const playable = getPlayableCards(player, pile);
    expect(playable).toHaveLength(1);
    expect(playable[0]!.id).toBe('c2');
  });
});
