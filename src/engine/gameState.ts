import {
  GameConfig,
  GamePhase,
  GameState,
  PlayerPhase,
  PlayerState,
  Rank,
  RNG,
  ChooseFaceUpAction,
  DEFAULT_CONFIG,
} from '../types';
import { createDeck, shuffleDeck, dealCards } from './deck';
import { isSpecialCard } from './rules';

function makeSeededRng(seed: number): RNG {
  // Simple mulberry32 PRNG
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGame(config: GameConfig = DEFAULT_CONFIG, rng?: RNG): GameState {
  const playerCount = config.cpuCount + 1;
  const deck = createDeck(config);
  const shuffled = shuffleDeck(deck, rng);
  const { hands, faceDowns, drawPile } = dealCards(shuffled, playerCount);

  const players: PlayerState[] = Array.from({ length: playerCount }, (_, i) => ({
    id: i,
    hand: hands[i]!,
    faceUp: [],
    faceDown: faceDowns[i]!,
    phase: PlayerPhase.HandAndDraw,
  }));

  return {
    gamePhase: GamePhase.Setup,
    drawPile,
    pile: [],
    burnPile: [],
    players,
    config,
    currentPlayerIndex: 0,
    mustPlayAgain: false,
    jumpInWindow: null,
    winnerId: null,
    turnNumber: 0,
    setupChoicesRemaining: playerCount,
    actionLog: [],
  };
}

export function createGameWithSeed(seed: number, config: GameConfig = DEFAULT_CONFIG): GameState {
  const rng = makeSeededRng(seed);
  return createGame(config, rng);
}

export function autoChooseFaceUp(
  state: GameState,
  playerIndex: number
): ChooseFaceUpAction {
  const player = state.players[playerIndex]!;
  const hand = [...player.hand];

  // Score cards: higher rank = better face-up, 10s are great, keep 2s/Jokers in hand
  const scored = hand.map((card) => {
    let score: number;
    if (card.rank === Rank.Ten) {
      score = 100; // 10s are excellent face-up (blow up pile)
    } else if (card.rank === Rank.Two || card.rank === Rank.Joker) {
      score = -100; // Keep wilds in hand
    } else {
      score = card.rank; // Higher rank = better face-up
    }
    return { card, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Pick top 3
  const chosen = scored.slice(0, 3).map((s) => s.card.id);

  return {
    type: 'CHOOSE_FACE_UP',
    playerIndex,
    cardIds: chosen,
  };
}
