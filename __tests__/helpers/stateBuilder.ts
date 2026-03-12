import {
  Card,
  GameConfig,
  GamePhase,
  GameState,
  PlayerPhase,
  PlayerState,
  DEFAULT_CONFIG,
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
  hands?: Card[][];
  faceUps?: Card[][];
  faceDowns?: Card[][];
  phases?: PlayerPhase[];
  pile?: Card[];
  drawPile?: Card[];
  burnPile?: Card[];
  currentPlayerIndex?: number;
  mustPlayAgain?: boolean;
  turnNumber?: number;
  playerCount?: number;
  config?: GameConfig;
}

export function buildPlayingState(config: PlayingStateConfig = {}): GameState {
  const count = config.playerCount ?? config.hands?.length ?? 4;
  const hands = config.hands ?? Array.from({ length: count }, () => []);
  const faceUps = config.faceUps ?? Array.from({ length: count }, () => []);
  const faceDowns = config.faceDowns ?? Array.from({ length: count }, () => []);
  const defaultPhase = PlayerPhase.HandAndDraw;
  const phases = config.phases ?? Array.from({ length: count }, () => defaultPhase);

  const players: PlayerState[] = Array.from({ length: count }, (_, i) =>
    buildPlayer(i, {
      hand: hands[i] ?? [],
      faceUp: faceUps[i] ?? [],
      faceDown: faceDowns[i] ?? [],
      phase: phases[i] ?? defaultPhase,
    })
  );

  return {
    gamePhase: GamePhase.Playing,
    drawPile: config.drawPile ?? [],
    pile: config.pile ?? [],
    burnPile: config.burnPile ?? [],
    players,
    config: config.config ?? DEFAULT_CONFIG,
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
    config: DEFAULT_CONFIG,
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
