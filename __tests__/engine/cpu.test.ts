import { decideCpuAction, decideCpuJumpIn } from '../../src/engine/cpu';
import { Rank, Suit, PlayerPhase } from '../../src/types';
import { card, joker, ten, two } from '../helpers/cardFactory';
import { buildPlayingState } from '../helpers/stateBuilder';

beforeEach(() => {
  require('../helpers/cardFactory').resetIdCounter();
});

describe('decideCpuAction', () => {
  it('plays lowest legal card', () => {
    const c3 = card(Rank.Three, Suit.Hearts, 'c3');
    const c7 = card(Rank.Seven, Suit.Hearts, 'c7');
    const cA = card(Rank.Ace, Suit.Hearts, 'cA');

    const state = buildPlayingState({
      hands: [[c3, c7, cA], [], [], []],
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const action = decideCpuAction(state, 0);
    expect(action.type).toBe('PLAY_CARDS');
    if (action.type === 'PLAY_CARDS') {
      expect(action.cardIds).toContain('c3');
    }
  });

  it('plays 10 when pile is large', () => {
    const t = ten(Suit.Hearts, 't1');
    const c3 = card(Rank.Three, Suit.Hearts, 'c3');
    const pile = Array.from({ length: 6 }, (_, i) =>
      card(Rank.Three, Suit.Hearts, `p${i}`)
    );

    const state = buildPlayingState({
      hands: [[t, c3], [], [], []],
      pile,
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const action = decideCpuAction(state, 0);
    expect(action.type).toBe('PLAY_CARDS');
    if (action.type === 'PLAY_CARDS') {
      expect(action.cardIds).toContain('t1');
    }
  });

  it('saves specials when normal cards work', () => {
    const w = two(Suit.Hearts, 'w1');
    const c5 = card(Rank.Five, Suit.Hearts, 'c5');

    const state = buildPlayingState({
      hands: [[w, c5], [], [], []],
      pile: [card(Rank.Three, Suit.Hearts, 'p1')],
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const action = decideCpuAction(state, 0);
    expect(action.type).toBe('PLAY_CARDS');
    if (action.type === 'PLAY_CARDS') {
      expect(action.cardIds).toContain('c5');
      expect(action.cardIds).not.toContain('w1');
    }
  });

  it('plays multiples of same rank', () => {
    const c7a = card(Rank.Seven, Suit.Hearts, 'c7a');
    const c7b = card(Rank.Seven, Suit.Diamonds, 'c7b');

    const state = buildPlayingState({
      hands: [[c7a, c7b], [], [], []],
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const action = decideCpuAction(state, 0);
    expect(action.type).toBe('PLAY_CARDS');
    if (action.type === 'PLAY_CARDS') {
      expect(action.cardIds).toHaveLength(2);
    }
  });

  it('picks up pile when nothing playable', () => {
    const c3 = card(Rank.Three, Suit.Hearts, 'c3');
    const pile = [card(Rank.Ace, Suit.Hearts, 'p1')];

    const state = buildPlayingState({
      hands: [[c3], [], [], []],
      pile,
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const action = decideCpuAction(state, 0);
    expect(action.type).toBe('PICK_UP_PILE');
  });

  it('flips random face-down in FaceDown phase', () => {
    const fd1 = card(Rank.Three, Suit.Hearts, 'fd1');
    const fd2 = card(Rank.Five, Suit.Hearts, 'fd2');

    const state = buildPlayingState({
      faceDowns: [[fd1, fd2], [], [], []],
      currentPlayerIndex: 0,
      phases: [PlayerPhase.FaceDown, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const action = decideCpuAction(state, 0);
    expect(action.type).toBe('FLIP_FACE_DOWN');
    if (action.type === 'FLIP_FACE_DOWN') {
      expect(action.slotIndex).toBeGreaterThanOrEqual(0);
      expect(action.slotIndex).toBeLessThan(2);
    }
  });

  it('uses special when only specials available', () => {
    const w = two(Suit.Hearts, 'w1');
    const pile = [card(Rank.King, Suit.Hearts, 'p1')];

    const state = buildPlayingState({
      hands: [[w], [], [], []],
      pile,
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const action = decideCpuAction(state, 0);
    expect(action.type).toBe('PLAY_CARDS');
    if (action.type === 'PLAY_CARDS') {
      expect(action.cardIds).toContain('w1');
    }
  });
});

describe('decideCpuJumpIn', () => {
  it('jumps in with 2+ matching cards', () => {
    const m1 = card(Rank.Seven, Suit.Diamonds, 'm1');
    const m2 = card(Rank.Seven, Suit.Clubs, 'm2');

    const state = buildPlayingState({
      hands: [[], [m1, m2], [], []],
      pile: [card(Rank.Seven, Suit.Hearts, 'p1')],
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const stateWithWindow = {
      ...state,
      jumpInWindow: { cardRank: Rank.Seven, playedByIndex: 0 },
    };

    const action = decideCpuJumpIn(stateWithWindow, 1);
    expect(action).not.toBeNull();
    expect(action!.type).toBe('JUMP_IN');
  });

  it('declines with only 1 matching card (no 4-of-a-kind)', () => {
    const m1 = card(Rank.Seven, Suit.Diamonds, 'm1');

    const state = buildPlayingState({
      hands: [[], [m1], [], []],
      pile: [card(Rank.Seven, Suit.Hearts, 'p1')],
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const stateWithWindow = {
      ...state,
      jumpInWindow: { cardRank: Rank.Seven, playedByIndex: 0 },
    };

    const action = decideCpuJumpIn(stateWithWindow, 1);
    expect(action).toBeNull();
  });

  it('jumps in with 1 card if would trigger 4-of-a-kind', () => {
    const m1 = card(Rank.Seven, Suit.Diamonds, 'm1');

    const pile = [
      card(Rank.Seven, Suit.Hearts, 'p1'),
      card(Rank.Seven, Suit.Clubs, 'p2'),
      card(Rank.Seven, Suit.Spades, 'p3'),
    ];

    const state = buildPlayingState({
      hands: [[], [m1], [], []],
      pile,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const stateWithWindow = {
      ...state,
      jumpInWindow: { cardRank: Rank.Seven, playedByIndex: 0 },
    };

    const action = decideCpuJumpIn(stateWithWindow, 1);
    expect(action).not.toBeNull();
  });

  it('returns null when no jump-in window', () => {
    const state = buildPlayingState({
      hands: [[], [card(Rank.Seven, Suit.Hearts, 'm1')], [], []],
    });

    expect(decideCpuJumpIn(state, 1)).toBeNull();
  });

  it('returns null for own play', () => {
    const state = buildPlayingState({
      hands: [[card(Rank.Seven, Suit.Hearts, 'm1')], [], [], []],
    });

    const stateWithWindow = {
      ...state,
      jumpInWindow: { cardRank: Rank.Seven, playedByIndex: 0 },
    };

    expect(decideCpuJumpIn(stateWithWindow, 0)).toBeNull();
  });
});
