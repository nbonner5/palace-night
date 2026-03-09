import { GameState, GameEvent } from '../../types';

export interface UIState {
  game: GameState;
  selectedCardIds: Set<string>;
  isProcessing: boolean;
}

export interface AnimationEvent {
  event: GameEvent;
  id: number;
}
