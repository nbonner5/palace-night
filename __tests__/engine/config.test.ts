import { createDeck, dealCards, validateConfig } from '../../src/engine/deck';
import { createGame, createGameWithSeed } from '../../src/engine/gameState';
import { processAction } from '../../src/engine/actions';
import { advanceTurn } from '../../src/engine/turnFlow';
import { GameConfig, GamePhase, Rank, DEFAULT_CONFIG } from '../../src/types';
import { simulateFullGame } from '../helpers/gameSimulator';
import { buildPlayingState } from '../helpers/stateBuilder';
import { card } from '../helpers/cardFactory';
import { Suit } from '../../src/types';

beforeEach(() => {
  require('../helpers/cardFactory').resetIdCounter();
});

describe('validateConfig', () => {
  it('accepts default config', () => {
    expect(validateConfig(DEFAULT_CONFIG)).toEqual({ valid: true });
  });

  it('accepts 1 deck + 4 CPUs (5 players * 9 = 45 <= 54)', () => {
    expect(validateConfig({ cpuCount: 4, deckCount: 1, includeJokers: true })).toEqual({ valid: true });
  });

  it('accepts 1 deck + 5 CPUs with jokers (6 * 9 = 54 <= 54)', () => {
    expect(validateConfig({ cpuCount: 5, deckCount: 1, includeJokers: true })).toEqual({ valid: true });
  });

  it('rejects 1 deck + 5 CPUs without jokers (6 * 9 = 54 > 52)', () => {
    const result = validateConfig({ cpuCount: 5, deckCount: 1, includeJokers: false });
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('rejects 1 deck + 6 CPUs with jokers (7 * 9 = 63 > 54)', () => {
    const result = validateConfig({ cpuCount: 6, deckCount: 1, includeJokers: true });
    expect(result.valid).toBe(false);
  });

  it('accepts 3 decks + 7 CPUs with jokers (8 * 9 = 72 <= 162)', () => {
    expect(validateConfig({ cpuCount: 7, deckCount: 3, includeJokers: true })).toEqual({ valid: true });
  });

  it('accepts 2 decks + 7 CPUs without jokers (8 * 9 = 72 <= 104)', () => {
    expect(validateConfig({ cpuCount: 7, deckCount: 2, includeJokers: false })).toEqual({ valid: true });
  });

  it('accepts minimal config: 1 CPU + 1 deck no jokers', () => {
    expect(validateConfig({ cpuCount: 1, deckCount: 1, includeJokers: false })).toEqual({ valid: true });
  });
});

describe('createDeck with configs', () => {
  it('1 deck no jokers = 52 cards', () => {
    const deck = createDeck({ cpuCount: 1, deckCount: 1, includeJokers: false });
    expect(deck).toHaveLength(52);
    expect(deck.filter(c => c.rank === Rank.Joker)).toHaveLength(0);
  });

  it('1 deck + jokers = 54 cards', () => {
    const deck = createDeck({ cpuCount: 1, deckCount: 1, includeJokers: true });
    expect(deck).toHaveLength(54);
    expect(deck.filter(c => c.rank === Rank.Joker)).toHaveLength(2);
  });

  it('2 decks + jokers = 108 cards (default)', () => {
    const deck = createDeck(DEFAULT_CONFIG);
    expect(deck).toHaveLength(108);
    expect(deck.filter(c => c.rank === Rank.Joker)).toHaveLength(4);
  });

  it('3 decks + jokers = 162 cards', () => {
    const deck = createDeck({ cpuCount: 1, deckCount: 3, includeJokers: true });
    expect(deck).toHaveLength(162);
    expect(deck.filter(c => c.rank === Rank.Joker)).toHaveLength(6);
  });

  it('3 decks no jokers = 156 cards', () => {
    const deck = createDeck({ cpuCount: 1, deckCount: 3, includeJokers: false });
    expect(deck).toHaveLength(156);
  });
});

describe('dealCards with variable player counts', () => {
  it('deals to 2 players', () => {
    const deck = createDeck({ cpuCount: 1, deckCount: 1, includeJokers: false });
    const result = dealCards(deck, 2);
    expect(result.hands).toHaveLength(2);
    expect(result.faceDowns).toHaveLength(2);
    for (const hand of result.hands) expect(hand).toHaveLength(6);
    for (const fd of result.faceDowns) expect(fd).toHaveLength(3);
    // 52 - (2 * 9) = 34
    expect(result.drawPile).toHaveLength(34);
  });

  it('deals to 8 players', () => {
    const deck = createDeck({ cpuCount: 7, deckCount: 3, includeJokers: true });
    const result = dealCards(deck, 8);
    expect(result.hands).toHaveLength(8);
    expect(result.faceDowns).toHaveLength(8);
    for (const hand of result.hands) expect(hand).toHaveLength(6);
    for (const fd of result.faceDowns) expect(fd).toHaveLength(3);
    // 162 - (8 * 9) = 90
    expect(result.drawPile).toHaveLength(90);
  });

  it('all cards accounted for with no duplicates', () => {
    const deck = createDeck({ cpuCount: 5, deckCount: 2, includeJokers: true });
    const result = dealCards(deck, 6);
    const allCards = [...result.drawPile, ...result.hands.flat(), ...result.faceDowns.flat()];
    expect(allCards).toHaveLength(108);
    const ids = allCards.map(c => c.id);
    expect(new Set(ids).size).toBe(108);
  });
});

describe('createGame with configs', () => {
  it('creates game with 1 CPU', () => {
    const config: GameConfig = { cpuCount: 1, deckCount: 1, includeJokers: false };
    const state = createGame(config);
    expect(state.players).toHaveLength(2);
    expect(state.setupChoicesRemaining).toBe(2);
    expect(state.config).toEqual(config);
  });

  it('creates game with 7 CPUs', () => {
    const config: GameConfig = { cpuCount: 7, deckCount: 3, includeJokers: true };
    const state = createGame(config);
    expect(state.players).toHaveLength(8);
    expect(state.setupChoicesRemaining).toBe(8);
    expect(state.config).toEqual(config);
  });

  it('draw pile size matches expected', () => {
    const config: GameConfig = { cpuCount: 3, deckCount: 1, includeJokers: true };
    const state = createGame(config);
    // 54 - (4 * 9) = 18
    expect(state.drawPile).toHaveLength(18);
  });

  it('default config produces standard 108-card game', () => {
    const state = createGame();
    expect(state.players).toHaveLength(4);
    // 108 - (4 * 9) = 72
    expect(state.drawPile).toHaveLength(72);
  });
});

describe('turn advancement with variable player counts', () => {
  it('advances turn with 2 players (0→1→0)', () => {
    const state = buildPlayingState({
      playerCount: 2,
      currentPlayerIndex: 0,
      hands: [
        [card(Rank.Three, Suit.Hearts, 'h1')],
        [card(Rank.Four, Suit.Hearts, 'h2')],
      ],
    });

    const result = advanceTurn(state);
    expect(result.state.currentPlayerIndex).toBe(1);

    const result2 = advanceTurn(result.state);
    expect(result2.state.currentPlayerIndex).toBe(0);
  });

  it('advances turn with 6 players', () => {
    const hands = Array.from({ length: 6 }, (_, i) => [card(Rank.Three, Suit.Hearts, `h${i}`)]);
    const state = buildPlayingState({
      playerCount: 6,
      currentPlayerIndex: 4,
      hands,
    });

    const result = advanceTurn(state);
    expect(result.state.currentPlayerIndex).toBe(5);

    const result2 = advanceTurn(result.state);
    expect(result2.state.currentPlayerIndex).toBe(0);
  });

  it('skips empty players in 6-player game', () => {
    const hands = [
      [card(Rank.Three, Suit.Hearts, 'h0')],
      [],
      [],
      [card(Rank.Four, Suit.Hearts, 'h3')],
      [],
      [card(Rank.Five, Suit.Hearts, 'h5')],
    ];
    const state = buildPlayingState({
      playerCount: 6,
      currentPlayerIndex: 0,
      hands,
    });

    const result = advanceTurn(state);
    expect(result.state.currentPlayerIndex).toBe(3);
  });
});

describe('integration: simulateFullGame with varied configs', () => {
  const configs: { name: string; config: GameConfig; seeds: number }[] = [
    {
      name: '1 CPU / 1 deck / no jokers',
      config: { cpuCount: 1, deckCount: 1, includeJokers: false },
      seeds: 10,
    },
    {
      name: '2 CPUs / 1 deck / jokers',
      config: { cpuCount: 2, deckCount: 1, includeJokers: true },
      seeds: 10,
    },
    {
      name: '6 CPUs / 3 decks / jokers',
      config: { cpuCount: 6, deckCount: 3, includeJokers: true },
      seeds: 10,
    },
    {
      name: '3 CPUs / 2 decks / no jokers',
      config: { cpuCount: 3, deckCount: 2, includeJokers: false },
      seeds: 10,
    },
  ];

  for (const { name, config, seeds } of configs) {
    it(`completes ${seeds} games with ${name}`, () => {
      for (let seed = 1; seed <= seeds; seed++) {
        const { state, actionCount } = simulateFullGame(seed, config, 2000);
        expect(state.gamePhase).toBe(GamePhase.Finished);
        expect(state.winnerId).not.toBeNull();
        expect(actionCount).toBeLessThan(2000);
      }
    });
  }
});
