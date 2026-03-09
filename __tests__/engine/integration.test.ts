import { simulateFullGame, assertInvariants } from '../helpers/gameSimulator';
import { createGameWithSeed } from '../../src/engine/gameState';
import { processAction } from '../../src/engine/actions';
import { decideCpuAction } from '../../src/engine/cpu';
import { GamePhase } from '../../src/types';

describe('Integration: Full Game Simulations', () => {
  it.each(Array.from({ length: 100 }, (_, i) => [i]))(
    'seed %i: game completes with valid winner and invariants',
    (seed) => {
      const { state, actionCount } = simulateFullGame(seed);

      expect(state.gamePhase).toBe(GamePhase.Finished);
      expect(state.winnerId).not.toBeNull();
      expect(actionCount).toBeLessThan(1000);

      // Winner has no cards
      const winner = state.players[state.winnerId!]!;
      expect(winner.hand).toHaveLength(0);
      expect(winner.faceUp).toHaveLength(0);
      expect(winner.faceDown).toHaveLength(0);

      // Final invariants
      assertInvariants(state);
    }
  );
});

describe('Integration: Determinism', () => {
  it('same seed produces identical game', () => {
    const result1 = simulateFullGame(42);
    const result2 = simulateFullGame(42);

    expect(result1.actionCount).toBe(result2.actionCount);
    expect(result1.state.winnerId).toBe(result2.state.winnerId);
    expect(result1.state.turnNumber).toBe(result2.state.turnNumber);

    // Check burn pile is identical
    expect(result1.state.burnPile.map((c) => c.id)).toEqual(
      result2.state.burnPile.map((c) => c.id)
    );
  });
});

describe('Integration: Card Conservation', () => {
  it('108 cards and unique IDs after every action', () => {
    let state = createGameWithSeed(7);
    assertInvariants(state);

    let actionCount = 0;
    while (state.gamePhase !== GamePhase.Finished && actionCount < 500) {
      const action = decideCpuAction(state, state.currentPlayerIndex);
      const result = processAction(state, action);
      state = result.state;
      actionCount++;

      // This is the critical assertion — after EVERY action
      assertInvariants(state);
    }

    expect(state.gamePhase).toBe(GamePhase.Finished);
  });
});

describe('Integration: Edge Cases', () => {
  it('handles games with lots of blowups', () => {
    // Seeds that tend to produce 10s and 4-of-a-kind situations
    for (const seed of [13, 27, 51, 88, 99]) {
      const { state } = simulateFullGame(seed);
      expect(state.gamePhase).toBe(GamePhase.Finished);
      expect(state.burnPile.length).toBeGreaterThan(0);
    }
  });
});
