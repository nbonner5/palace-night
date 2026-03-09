import {
  GamePhase,
  GameState,
  PlayerPhase,
  PlayerState,
  Rank,
  RNG,
  ChooseFaceUpAction,
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

export function createGame(rng?: RNG): GameState {
  const deck = createDeck();
  const shuffled = shuffleDeck(deck, rng);
  const { hands, faceDowns, drawPile } = dealCards(shuffled);

  const players: [PlayerState, PlayerState, PlayerState, PlayerState] = [
    { id: 0, hand: hands[0], faceUp: [], faceDown: faceDowns[0], phase: PlayerPhase.HandAndDraw },
    { id: 1, hand: hands[1], faceUp: [], faceDown: faceDowns[1], phase: PlayerPhase.HandAndDraw },
    { id: 2, hand: hands[2], faceUp: [], faceDown: faceDowns[2], phase: PlayerPhase.HandAndDraw },
    { id: 3, hand: hands[3], faceUp: [], faceDown: faceDowns[3], phase: PlayerPhase.HandAndDraw },
  ];

  return {
    gamePhase: GamePhase.Setup,
    drawPile,
    pile: [],
    burnPile: [],
    players,
    currentPlayerIndex: 0,
    mustPlayAgain: false,
    jumpInWindow: null,
    winnerId: null,
    turnNumber: 0,
    setupChoicesRemaining: 4,
    actionLog: [],
  };
}

export function createGameWithSeed(seed: number): GameState {
  const rng = makeSeededRng(seed);
  return createGame(rng);
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
