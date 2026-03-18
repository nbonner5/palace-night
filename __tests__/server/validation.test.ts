import { GamePhase, Rank, Suit } from '../../src/types';
import { card } from '../helpers/cardFactory';
import { buildPlayingState, buildState } from '../helpers/stateBuilder';
import { validatePlayerAction } from '../../server/src/validation';

describe('validatePlayerAction', () => {
  it('rejects stale state version', () => {
    const state = buildPlayingState({ currentPlayerIndex: 0 });
    const action = { type: 'PLAY_CARDS' as const, playerIndex: 0, cardIds: ['c1'] };

    const result = validatePlayerAction(state, action, 0, 1, 2);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Stale');
  });

  it('rejects acting for another player', () => {
    const state = buildPlayingState({ currentPlayerIndex: 0 });
    const action = { type: 'PLAY_CARDS' as const, playerIndex: 1, cardIds: ['c1'] };

    const result = validatePlayerAction(state, action, 0, 1, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('another player');
  });

  it('rejects actions when game is finished', () => {
    const state = buildState({ gamePhase: GamePhase.Finished });
    const action = { type: 'PLAY_CARDS' as const, playerIndex: 0, cardIds: ['c1'] };

    const result = validatePlayerAction(state, action, 0, 1, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('finished');
  });

  it('rejects non-CHOOSE_FACE_UP during setup', () => {
    const state = buildState({ gamePhase: GamePhase.Setup, currentPlayerIndex: 0 });
    const action = { type: 'PLAY_CARDS' as const, playerIndex: 0, cardIds: ['c1'] };

    const result = validatePlayerAction(state, action, 0, 1, 1);
    expect(result.valid).toBe(false);
  });

  it('allows CHOOSE_FACE_UP during setup for current player', () => {
    const state = buildState({ gamePhase: GamePhase.Setup, currentPlayerIndex: 0 });
    const action = { type: 'CHOOSE_FACE_UP' as const, playerIndex: 0, cardIds: ['c1', 'c2', 'c3'] };

    const result = validatePlayerAction(state, action, 0, 1, 1);
    expect(result.valid).toBe(true);
  });

  it('rejects play when not your turn', () => {
    const state = buildPlayingState({ currentPlayerIndex: 1 });
    const action = { type: 'PLAY_CARDS' as const, playerIndex: 0, cardIds: ['c1'] };

    const result = validatePlayerAction(state, action, 0, 1, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Not your turn');
  });

  it('allows play on your turn', () => {
    const state = buildPlayingState({ currentPlayerIndex: 0 });
    const action = { type: 'PLAY_CARDS' as const, playerIndex: 0, cardIds: ['c1'] };

    const result = validatePlayerAction(state, action, 0, 1, 1);
    expect(result.valid).toBe(true);
  });

  it('allows jump-in when window is open regardless of turn', () => {
    const state = {
      ...buildPlayingState({ currentPlayerIndex: 1 }),
      jumpInWindow: { cardRank: Rank.Seven, playedByIndex: 1 },
    };
    const action = { type: 'JUMP_IN' as const, playerIndex: 0, cardIds: ['c1'] };

    const result = validatePlayerAction(state, action, 0, 1, 1);
    expect(result.valid).toBe(true);
  });

  it('rejects jump-in when no window open', () => {
    const state = buildPlayingState({ currentPlayerIndex: 1 });
    const action = { type: 'JUMP_IN' as const, playerIndex: 0, cardIds: ['c1'] };

    const result = validatePlayerAction(state, action, 0, 1, 1);
    expect(result.valid).toBe(false);
  });
});
