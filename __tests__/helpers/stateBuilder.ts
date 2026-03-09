import {
  Card,
  GamePhase,
  GameState,
  PlayerPhase,
  PlayerState,
} from '../../src/types';

export function buildPlayer(
  index: number,
  overrides: Partial<PlayerState> = {}
): PlayerState {
  return {
    id: index,
    hand: [],
    faceUp: [],
    faceDown: [],
    phase: PlayerPhase.HandAndDraw,
    ...overrides,
  };
}

interface PlayingStateConfig {
  hands?: [Card[], Card[], Card[], Card[]];
  faceUps?: [Card[], Card[], Card[], Card[]];
  faceDowns?: [Card[], Card[], Card[], Card[]];
  phases?: [PlayerPhase, PlayerPhase, PlayerPhase, PlayerPhase];
  pile?: Card[];
  drawPile?: Card[];
  burnPile?: Card[];
  currentPlayerIndex?: number;
  mustPlayAgain?: boolean;
  turnNumber?: number;
}

export function buildPlayingState(config: PlayingStateConfig = {}): GameState {
  const hands = config.hands ?? [[], [], [], []];
  const faceUps = config.faceUps ?? [[], [], [], []];
  const faceDowns = config.faceDowns ?? [[], [], [], []];
  const phases = config.phases ?? [
    PlayerPhase.HandAndDraw,
    PlayerPhase.HandAndDraw,
    PlayerPhase.HandAndDraw,
    PlayerPhase.HandAndDraw,
  ];

  const players: [PlayerState, PlayerState, PlayerState, PlayerState] = [
    buildPlayer(0, { hand: hands[0], faceUp: faceUps[0], faceDown: faceDowns[0], phase: phases[0] }),
    buildPlayer(1, { hand: hands[1], faceUp: faceUps[1], faceDown: faceDowns[1], phase: phases[1] }),
    buildPlayer(2, { hand: hands[2], faceUp: faceUps[2], faceDown: faceDowns[2], phase: phases[2] }),
    buildPlayer(3, { hand: hands[3], faceUp: faceUps[3], faceDown: faceDowns[3], phase: phases[3] }),
  ];

  return {
    gamePhase: GamePhase.Playing,
    drawPile: config.drawPile ?? [],
    pile: config.pile ?? [],
    burnPile: config.burnPile ?? [],
    players,
    currentPlayerIndex: config.currentPlayerIndex ?? 0,
    mustPlayAgain: config.mustPlayAgain ?? false,
    jumpInWindow: null,
    winnerId: null,
    turnNumber: config.turnNumber ?? 1,
    setupChoicesRemaining: 0,
    actionLog: [],
  };
}

export function buildState(overrides: Partial<GameState> = {}): GameState {
  const defaultState: GameState = {
    gamePhase: GamePhase.Playing,
    drawPile: [],
    pile: [],
    burnPile: [],
    players: [
      buildPlayer(0),
      buildPlayer(1),
      buildPlayer(2),
      buildPlayer(3),
    ],
    currentPlayerIndex: 0,
    mustPlayAgain: false,
    jumpInWindow: null,
    winnerId: null,
    turnNumber: 1,
    setupChoicesRemaining: 0,
    actionLog: [],
  };
  return { ...defaultState, ...overrides };
}
