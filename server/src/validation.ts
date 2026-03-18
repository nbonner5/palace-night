import { Action, GamePhase, GameState } from '../../src/types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePlayerAction(
  state: GameState,
  action: Action,
  seatIndex: number,
  stateVersion: number,
  currentVersion: number
): ValidationResult {
  // Check state version (stale action detection)
  if (stateVersion !== currentVersion) {
    return { valid: false, error: 'Stale action — state has changed' };
  }

  // Ensure the action's playerIndex matches the seat
  if (action.playerIndex !== seatIndex) {
    return { valid: false, error: 'Cannot act for another player' };
  }

  // Game must be active
  if (state.gamePhase === GamePhase.Finished) {
    return { valid: false, error: 'Game is finished' };
  }

  // Setup phase: only current player can choose
  if (state.gamePhase === GamePhase.Setup) {
    if (action.type !== 'CHOOSE_FACE_UP') {
      return { valid: false, error: 'Only CHOOSE_FACE_UP allowed during setup' };
    }
    if (state.currentPlayerIndex !== seatIndex) {
      return { valid: false, error: 'Not your turn to choose face-up cards' };
    }
    return { valid: true };
  }

  // Playing phase
  if (action.type === 'JUMP_IN') {
    // Jump-ins don't require it to be your turn
    if (!state.jumpInWindow) {
      return { valid: false, error: 'No jump-in window open' };
    }
    return { valid: true };
  }

  // All other actions require it to be your turn
  if (state.currentPlayerIndex !== seatIndex) {
    return { valid: false, error: 'Not your turn' };
  }

  return { valid: true };
}
