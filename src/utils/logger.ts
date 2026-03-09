import { Action, GameEvent, GameState } from '../types';

let DEBUG_MODE = false;

export function setDebugMode(enabled: boolean): void {
  DEBUG_MODE = enabled;
}

export function logAction(action: Action): void {
  if (!DEBUG_MODE) return;
  console.log(`[ACTION] ${action.type} by player ${action.playerIndex}`);
}

export function logEvents(events: readonly GameEvent[]): void {
  if (!DEBUG_MODE) return;
  for (const event of events) {
    console.log(`[EVENT] ${event.type}`, event);
  }
}

export function logState(state: GameState): void {
  if (!DEBUG_MODE) return;
  console.log(`[STATE] Turn ${state.turnNumber} | Player ${state.currentPlayerIndex} | Phase ${state.gamePhase}`);
  console.log(`  Pile: ${state.pile.length} | Draw: ${state.drawPile.length} | Burn: ${state.burnPile.length}`);
  for (const player of state.players) {
    console.log(
      `  P${player.id}: hand=${player.hand.length} faceUp=${player.faceUp.length} faceDown=${player.faceDown.length} phase=${player.phase}`
    );
  }
}
