// ── Enums ──

export enum Rank {
  Joker = 0,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13,
  Ace = 14,
}

export enum Suit {
  Hearts = 'H',
  Diamonds = 'D',
  Clubs = 'C',
  Spades = 'S',
}

export enum PlayerPhase {
  HandAndDraw = 'HandAndDraw',
  HandOnly = 'HandOnly',
  FaceUp = 'FaceUp',
  FaceDown = 'FaceDown',
}

export enum GamePhase {
  Setup = 'Setup',
  Playing = 'Playing',
  Finished = 'Finished',
}

// ── Core Types ──

export interface Card {
  readonly id: string;
  readonly rank: Rank;
  readonly suit: Suit | null; // null for Jokers
}

export interface PlayerState {
  readonly id: number;
  readonly hand: readonly Card[];
  readonly faceUp: readonly Card[];
  readonly faceDown: readonly Card[];
  readonly phase: PlayerPhase;
}

export interface JumpInWindow {
  readonly cardRank: Rank;
  readonly playedByIndex: number;
}

export interface GameState {
  readonly gamePhase: GamePhase;
  readonly drawPile: readonly Card[];
  readonly pile: readonly Card[];
  readonly burnPile: readonly Card[];
  readonly players: readonly [PlayerState, PlayerState, PlayerState, PlayerState];
  readonly currentPlayerIndex: number;
  readonly mustPlayAgain: boolean;
  readonly jumpInWindow: JumpInWindow | null;
  readonly winnerId: number | null;
  readonly turnNumber: number;
  readonly setupChoicesRemaining: number;
  readonly actionLog: readonly string[];
}

// ── Actions ──

export interface ChooseFaceUpAction {
  readonly type: 'CHOOSE_FACE_UP';
  readonly playerIndex: number;
  readonly cardIds: readonly string[];
}

export interface PlayCardsAction {
  readonly type: 'PLAY_CARDS';
  readonly playerIndex: number;
  readonly cardIds: readonly string[];
}

export interface FlipFaceDownAction {
  readonly type: 'FLIP_FACE_DOWN';
  readonly playerIndex: number;
  readonly slotIndex: number;
}

export interface PickUpPileAction {
  readonly type: 'PICK_UP_PILE';
  readonly playerIndex: number;
}

export interface JumpInAction {
  readonly type: 'JUMP_IN';
  readonly playerIndex: number;
  readonly cardIds: readonly string[];
}

export type Action =
  | ChooseFaceUpAction
  | PlayCardsAction
  | FlipFaceDownAction
  | PickUpPileAction
  | JumpInAction;

// ── Events ──

export interface CardsPlayedEvent {
  readonly type: 'CARDS_PLAYED';
  readonly playerIndex: number;
  readonly cards: readonly Card[];
}

export interface CardDrawnEvent {
  readonly type: 'CARD_DRAWN';
  readonly playerIndex: number;
  readonly count: number;
}

export interface PilePickedUpEvent {
  readonly type: 'PILE_PICKED_UP';
  readonly playerIndex: number;
  readonly cardCount: number;
}

export interface BlowupEvent {
  readonly type: 'BLOWUP';
  readonly reason: 'TEN' | 'FOUR_OF_A_KIND';
  readonly cardCount: number;
}

export interface FaceDownFlippedEvent {
  readonly type: 'FACE_DOWN_FLIPPED';
  readonly playerIndex: number;
  readonly card: Card;
  readonly playable: boolean;
}

export interface JumpInEvent {
  readonly type: 'JUMP_IN';
  readonly playerIndex: number;
  readonly cards: readonly Card[];
}

export interface PhaseChangeEvent {
  readonly type: 'PHASE_CHANGE';
  readonly playerIndex: number;
  readonly from: PlayerPhase;
  readonly to: PlayerPhase;
}

export interface TurnChangeEvent {
  readonly type: 'TURN_CHANGE';
  readonly from: number;
  readonly to: number;
}

export interface GameWonEvent {
  readonly type: 'GAME_WON';
  readonly playerIndex: number;
}

export type GameEvent =
  | CardsPlayedEvent
  | CardDrawnEvent
  | PilePickedUpEvent
  | BlowupEvent
  | FaceDownFlippedEvent
  | JumpInEvent
  | PhaseChangeEvent
  | TurnChangeEvent
  | GameWonEvent;

// ── Result ──

export interface ActionResult {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

// ── RNG ──

export type RNG = () => number;
