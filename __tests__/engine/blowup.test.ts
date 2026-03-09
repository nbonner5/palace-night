import { checkBlowup, executeBlowup } from '../../src/engine/blowup';
import { Rank, Suit } from '../../src/types';
import { card, ten, two, joker } from '../helpers/cardFactory';
import { buildPlayingState } from '../helpers/stateBuilder';

beforeEach(() => {
  require('../helpers/cardFactory').resetIdCounter();
});

describe('checkBlowup', () => {
  it('detects 10 on top', () => {
    const pile = [card(Rank.Five, Suit.Hearts, 'p1'), ten(Suit.Hearts, 'p2')];
    const result = checkBlowup(pile);
    expect(result.blowup).toBe(true);
    expect(result.reason).toBe('TEN');
  });

  it('detects 4-of-a-kind', () => {
    const pile = [
      card(Rank.Seven, Suit.Hearts, 'p1'),
      card(Rank.Seven, Suit.Diamonds, 'p2'),
      card(Rank.Seven, Suit.Clubs, 'p3'),
      card(Rank.Seven, Suit.Spades, 'p4'),
    ];
    const result = checkBlowup(pile);
    expect(result.blowup).toBe(true);
    expect(result.reason).toBe('FOUR_OF_A_KIND');
  });

  it('does not detect 3-of-a-kind', () => {
    const pile = [
      card(Rank.Seven, Suit.Hearts, 'p1'),
      card(Rank.Seven, Suit.Diamonds, 'p2'),
      card(Rank.Seven, Suit.Clubs, 'p3'),
    ];
    expect(checkBlowup(pile).blowup).toBe(false);
  });

  it('2s/Jokers break 4-of-a-kind chain', () => {
    // [7, 7, 2, 7, 7] → only 2 consecutive 7s on top
    const pile = [
      card(Rank.Seven, Suit.Hearts, 'p1'),
      card(Rank.Seven, Suit.Diamonds, 'p2'),
      two(Suit.Clubs, 'p3'),
      card(Rank.Seven, Suit.Clubs, 'p4'),
      card(Rank.Seven, Suit.Spades, 'p5'),
    ];
    expect(checkBlowup(pile).blowup).toBe(false);
  });

  it('Joker breaks chain too', () => {
    const pile = [
      card(Rank.Seven, Suit.Hearts, 'p1'),
      card(Rank.Seven, Suit.Diamonds, 'p2'),
      joker('p3'),
      card(Rank.Seven, Suit.Clubs, 'p4'),
      card(Rank.Seven, Suit.Spades, 'p5'),
    ];
    expect(checkBlowup(pile).blowup).toBe(false);
  });

  it('returns false for empty pile', () => {
    expect(checkBlowup([]).blowup).toBe(false);
  });

  it('returns false for single card (non-10)', () => {
    expect(checkBlowup([card(Rank.Seven)]).blowup).toBe(false);
  });
});

describe('executeBlowup', () => {
  it('moves pile to burnPile and clears pile', () => {
    const pileCards = [
      card(Rank.Seven, Suit.Hearts, 'p1'),
      card(Rank.Seven, Suit.Diamonds, 'p2'),
    ];
    const state = buildPlayingState({ pile: pileCards });

    const result = executeBlowup(state);
    expect(result.pile).toEqual([]);
    expect(result.burnPile).toHaveLength(2);
    expect(result.mustPlayAgain).toBe(true);
    expect(result.jumpInWindow).toBeNull();
  });

  it('appends to existing burnPile', () => {
    const existingBurn = [card(Rank.Three, Suit.Hearts, 'b1')];
    const pileCards = [card(Rank.Ten, Suit.Hearts, 'p1')];
    const state = buildPlayingState({ pile: pileCards, burnPile: existingBurn });

    const result = executeBlowup(state);
    expect(result.burnPile).toHaveLength(2);
  });
});
