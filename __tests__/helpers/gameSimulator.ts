import { GameState, GamePhase, Card } from '../../src/types';
import { createGameWithSeed } from '../../src/engine/gameState';
import { processAction } from '../../src/engine/actions';
import { decideCpuAction } from '../../src/engine/cpu';

export function assertInvariants(state: GameState): void {
  // Collect all cards
  const allCards: Card[] = [
    ...state.drawPile,
    ...state.pile,
    ...state.burnPile,
  ];
  for (const player of state.players) {
    allCards.push(...player.hand, ...player.faceUp, ...player.faceDown);
  }

  // Total cards = 108
  if (allCards.length !== 108) {
    throw new Error(
      `Card count invariant violated: expected 108, got ${allCards.length}`
    );
  }

  // No duplicate IDs
  const ids = new Set<string>();
  for (const card of allCards) {
    if (ids.has(card.id)) {
      throw new Error(`Duplicate card ID: ${card.id}`);
    }
    ids.add(card.id);
  }

  // Current player index is valid
  if (state.currentPlayerIndex < 0 || state.currentPlayerIndex > 3) {
    throw new Error(
      `Invalid currentPlayerIndex: ${state.currentPlayerIndex}`
    );
  }

  // Winner validation
  if (state.winnerId !== null) {
    const winner = state.players[state.winnerId];
    if (
      winner &&
      (winner.hand.length > 0 ||
        winner.faceUp.length > 0 ||
        winner.faceDown.length > 0)
    ) {
      throw new Error(
        `Winner ${state.winnerId} still has cards`
      );
    }
  }
}

export function simulateFullGame(
  seed: number,
  maxActions: number = 1000
): { state: GameState; actionCount: number } {
  let state = createGameWithSeed(seed);

  // Auto-choose face-up for all players during setup
  let actionCount = 0;
  while (state.gamePhase === GamePhase.Setup && actionCount < maxActions) {
    const action = decideCpuAction(state, state.currentPlayerIndex);
    const result = processAction(state, action);
    state = result.state;
    actionCount++;
    assertInvariants(state);
  }

  // Play the game
  while (
    state.gamePhase === GamePhase.Playing &&
    actionCount < maxActions
  ) {
    const action = decideCpuAction(state, state.currentPlayerIndex);
    const result = processAction(state, action);
    state = result.state;
    actionCount++;
    assertInvariants(state);
  }

  return { state, actionCount };
}
