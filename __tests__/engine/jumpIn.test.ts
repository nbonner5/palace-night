import { canJumpIn, getJumpInWindow } from '../../src/engine/jumpIn';
import { Rank, Suit, PlayerPhase } from '../../src/types';
import { card, joker, two, ten } from '../helpers/cardFactory';
import { buildPlayingState, buildPlayer } from '../helpers/stateBuilder';

beforeEach(() => {
  require('../helpers/cardFactory').resetIdCounter();
});

describe('canJumpIn', () => {
  it('allows valid jump-in', () => {
    const matchCard = card(Rank.Seven, Suit.Diamonds, 'ji1');
    const state = buildPlayingState({
      hands: [
        [],
        [matchCard, card(Rank.Five, Suit.Hearts, 'o1')],
        [],
        [],
      ],
      phases: [
        PlayerPhase.HandAndDraw,
        PlayerPhase.HandAndDraw,
        PlayerPhase.HandAndDraw,
        PlayerPhase.HandAndDraw,
      ],
      pile: [card(Rank.Seven, Suit.Hearts, 'pile1')],
    });

    const stateWithWindow = {
      ...state,
      jumpInWindow: { cardRank: Rank.Seven, playedByIndex: 0 },
    };

    expect(canJumpIn(stateWithWindow, 1, ['ji1'])).toBe(true);
  });

  it('rejects when no jump-in window', () => {
    const matchCard = card(Rank.Seven, Suit.Diamonds, 'ji1');
    const state = buildPlayingState({
      hands: [[], [matchCard], [], []],
    });

    expect(canJumpIn(state, 1, ['ji1'])).toBe(false);
  });

  it('allows same player who played (self-jump-in)', () => {
    const matchCard = card(Rank.Seven, Suit.Diamonds, 'ji1');
    const state = buildPlayingState({
      hands: [[matchCard], [], [], []],
    });

    const stateWithWindow = {
      ...state,
      jumpInWindow: { cardRank: Rank.Seven, playedByIndex: 0 },
    };

    expect(canJumpIn(stateWithWindow, 0, ['ji1'])).toBe(true);
  });

  it('rejects wrong rank', () => {
    const wrongCard = card(Rank.Eight, Suit.Diamonds, 'ji1');
    const state = buildPlayingState({
      hands: [[], [wrongCard], [], []],
    });

    const stateWithWindow = {
      ...state,
      jumpInWindow: { cardRank: Rank.Seven, playedByIndex: 0 },
    };

    expect(canJumpIn(stateWithWindow, 1, ['ji1'])).toBe(false);
  });

  it('rejects jump-in on 2', () => {
    const matchCard = two(Suit.Diamonds, 'ji1');
    const state = buildPlayingState({
      hands: [[], [matchCard], [], []],
    });

    const stateWithWindow = {
      ...state,
      jumpInWindow: { cardRank: Rank.Two, playedByIndex: 0 },
    };

    expect(canJumpIn(stateWithWindow, 1, ['ji1'])).toBe(false);
  });

  it('rejects jump-in on Joker', () => {
    const matchCard = joker('ji1');
    const state = buildPlayingState({
      hands: [[], [matchCard], [], []],
    });

    const stateWithWindow = {
      ...state,
      jumpInWindow: { cardRank: Rank.Joker, playedByIndex: 0 },
    };

    expect(canJumpIn(stateWithWindow, 1, ['ji1'])).toBe(false);
  });

  it('rejects from FaceUp phase', () => {
    const matchCard = card(Rank.Seven, Suit.Diamonds, 'ji1');
    const state = buildPlayingState({
      hands: [[], [], [], []],
      faceUps: [[], [matchCard], [], []],
      phases: [
        PlayerPhase.HandAndDraw,
        PlayerPhase.FaceUp,
        PlayerPhase.HandAndDraw,
        PlayerPhase.HandAndDraw,
      ],
    });

    const stateWithWindow = {
      ...state,
      jumpInWindow: { cardRank: Rank.Seven, playedByIndex: 0 },
    };

    expect(canJumpIn(stateWithWindow, 1, ['ji1'])).toBe(false);
  });

  it('allows from FaceDown phase with hand card', () => {
    const matchCard = card(Rank.Seven, Suit.Diamonds, 'ji1');
    const state = buildPlayingState({
      hands: [[], [matchCard], [], []],
      faceDowns: [[], [card(Rank.Five, Suit.Hearts, 'fd1')], [], []],
      phases: [
        PlayerPhase.HandAndDraw,
        PlayerPhase.FaceDown,
        PlayerPhase.HandAndDraw,
        PlayerPhase.HandAndDraw,
      ],
    });

    const stateWithWindow = {
      ...state,
      jumpInWindow: { cardRank: Rank.Seven, playedByIndex: 0 },
    };

    expect(canJumpIn(stateWithWindow, 1, ['ji1'])).toBe(true);
  });

  it('rejects from FaceDown phase with empty hand', () => {
    const state = buildPlayingState({
      hands: [[], [], [], []],
      faceDowns: [[], [card(Rank.Seven, Suit.Diamonds, 'fd1')], [], []],
      phases: [
        PlayerPhase.HandAndDraw,
        PlayerPhase.FaceDown,
        PlayerPhase.HandAndDraw,
        PlayerPhase.HandAndDraw,
      ],
    });

    const stateWithWindow = {
      ...state,
      jumpInWindow: { cardRank: Rank.Seven, playedByIndex: 0 },
    };

    expect(canJumpIn(stateWithWindow, 1, ['fd1'])).toBe(false);
  });
});

describe('getJumpInWindow', () => {
  it('returns window for normal card play', () => {
    const played = [card(Rank.Seven, Suit.Hearts, 'c1')];
    const window = getJumpInWindow(played, 0);
    expect(window).toEqual({ cardRank: Rank.Seven, playedByIndex: 0 });
  });

  it('returns null for 2', () => {
    expect(getJumpInWindow([two()], 0)).toBeNull();
  });

  it('returns null for 10', () => {
    expect(getJumpInWindow([ten()], 0)).toBeNull();
  });

  it('returns null for Joker', () => {
    expect(getJumpInWindow([joker()], 0)).toBeNull();
  });

  it('returns null for empty cards', () => {
    expect(getJumpInWindow([], 0)).toBeNull();
  });
});
