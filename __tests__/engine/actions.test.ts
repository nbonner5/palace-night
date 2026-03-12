import { processAction } from '../../src/engine/actions';
import { Rank, Suit, PlayerPhase, GamePhase } from '../../src/types';
import { card, joker, ten, two } from '../helpers/cardFactory';
import { buildPlayingState, buildState, buildPlayer } from '../helpers/stateBuilder';

beforeEach(() => {
  require('../helpers/cardFactory').resetIdCounter();
});

describe('CHOOSE_FACE_UP', () => {
  it('moves 3 cards from hand to faceUp', () => {
    const h1 = card(Rank.Ace, Suit.Hearts, 'h1');
    const h2 = card(Rank.King, Suit.Hearts, 'h2');
    const h3 = card(Rank.Ten, Suit.Hearts, 'h3');
    const h4 = card(Rank.Five, Suit.Hearts, 'h4');
    const h5 = card(Rank.Three, Suit.Hearts, 'h5');
    const h6 = card(Rank.Seven, Suit.Hearts, 'h6');

    const state = buildState({
      gamePhase: GamePhase.Setup,
      setupChoicesRemaining: 4,
      currentPlayerIndex: 0,
      players: [
        buildPlayer(0, { hand: [h1, h2, h3, h4, h5, h6] }),
        buildPlayer(1, { hand: [card(Rank.Three, Suit.Diamonds, 'p1a'), card(Rank.Four, Suit.Diamonds, 'p1b'), card(Rank.Five, Suit.Diamonds, 'p1c'), card(Rank.Six, Suit.Diamonds, 'p1d'), card(Rank.Seven, Suit.Diamonds, 'p1e'), card(Rank.Eight, Suit.Diamonds, 'p1f')] }),
        buildPlayer(2, { hand: [card(Rank.Three, Suit.Clubs, 'p2a'), card(Rank.Four, Suit.Clubs, 'p2b'), card(Rank.Five, Suit.Clubs, 'p2c'), card(Rank.Six, Suit.Clubs, 'p2d'), card(Rank.Seven, Suit.Clubs, 'p2e'), card(Rank.Eight, Suit.Clubs, 'p2f')] }),
        buildPlayer(3, { hand: [card(Rank.Three, Suit.Spades, 'p3a'), card(Rank.Four, Suit.Spades, 'p3b'), card(Rank.Five, Suit.Spades, 'p3c'), card(Rank.Six, Suit.Spades, 'p3d'), card(Rank.Seven, Suit.Spades, 'p3e'), card(Rank.Eight, Suit.Spades, 'p3f')] }),
      ],
    });

    const result = processAction(state, {
      type: 'CHOOSE_FACE_UP',
      playerIndex: 0,
      cardIds: ['h1', 'h2', 'h3'],
    });

    expect(result.state.players[0]!.hand).toHaveLength(3);
    expect(result.state.players[0]!.faceUp).toHaveLength(3);
    expect(result.state.setupChoicesRemaining).toBe(3);
    expect(result.state.currentPlayerIndex).toBe(1);
  });

  it('transitions to Playing when all players chosen', () => {
    const makeHand = (prefix: string, suit: Suit) => [
      card(Rank.Three, suit, `${prefix}1`),
      card(Rank.Four, suit, `${prefix}2`),
      card(Rank.Five, suit, `${prefix}3`),
    ];

    const state = buildState({
      gamePhase: GamePhase.Setup,
      setupChoicesRemaining: 1,
      currentPlayerIndex: 3,
      players: [
        buildPlayer(0, { hand: makeHand('p0', Suit.Hearts), faceUp: [card(Rank.Ace, Suit.Hearts, 'fu0a'), card(Rank.King, Suit.Hearts, 'fu0b'), card(Rank.Queen, Suit.Hearts, 'fu0c')] }),
        buildPlayer(1, { hand: makeHand('p1', Suit.Diamonds), faceUp: [card(Rank.Ace, Suit.Diamonds, 'fu1a'), card(Rank.King, Suit.Diamonds, 'fu1b'), card(Rank.Queen, Suit.Diamonds, 'fu1c')] }),
        buildPlayer(2, { hand: makeHand('p2', Suit.Clubs), faceUp: [card(Rank.Ace, Suit.Clubs, 'fu2a'), card(Rank.King, Suit.Clubs, 'fu2b'), card(Rank.Queen, Suit.Clubs, 'fu2c')] }),
        buildPlayer(3, { hand: [card(Rank.Three, Suit.Spades, 'p3x'), card(Rank.Four, Suit.Spades, 'p3y'), card(Rank.Five, Suit.Spades, 'p3z'), card(Rank.Ace, Suit.Spades, 'p3a'), card(Rank.King, Suit.Spades, 'p3b'), card(Rank.Queen, Suit.Spades, 'p3c')] }),
      ],
    });

    const result = processAction(state, {
      type: 'CHOOSE_FACE_UP',
      playerIndex: 3,
      cardIds: ['p3a', 'p3b', 'p3c'],
    });

    expect(result.state.gamePhase).toBe(GamePhase.Playing);
  });

  it('throws on wrong phase', () => {
    const state = buildPlayingState();
    expect(() =>
      processAction(state, {
        type: 'CHOOSE_FACE_UP',
        playerIndex: 0,
        cardIds: [],
      })
    ).toThrow();
  });
});

describe('PLAY_CARDS', () => {
  it('plays a single card', () => {
    const c1 = card(Rank.Seven, Suit.Hearts, 'c1');
    const state = buildPlayingState({
      hands: [[c1, card(Rank.Five, Suit.Hearts, 'c2')], [], [], []],
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = processAction(state, {
      type: 'PLAY_CARDS',
      playerIndex: 0,
      cardIds: ['c1'],
    });

    expect(result.state.pile).toHaveLength(1);
    expect(result.state.pile[0]!.id).toBe('c1');
    expect(result.state.players[0]!.hand).toHaveLength(1);
  });

  it('plays multiple cards of same rank', () => {
    const c1 = card(Rank.Seven, Suit.Hearts, 'c1');
    const c2 = card(Rank.Seven, Suit.Diamonds, 'c2');
    const state = buildPlayingState({
      hands: [[c1, c2], [card(Rank.Three, Suit.Hearts, 'o1')], [], []],
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = processAction(state, {
      type: 'PLAY_CARDS',
      playerIndex: 0,
      cardIds: ['c1', 'c2'],
    });

    expect(result.state.pile).toHaveLength(2);
    expect(result.state.players[0]!.hand).toHaveLength(0);
  });

  it('playing 2 sets mustPlayAgain', () => {
    const c1 = two(Suit.Hearts, 'c1');
    const state = buildPlayingState({
      hands: [[c1, card(Rank.Five, Suit.Hearts, 'keep')], [card(Rank.Three, Suit.Hearts, 'o1')], [], []],
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = processAction(state, {
      type: 'PLAY_CARDS',
      playerIndex: 0,
      cardIds: ['c1'],
    });

    expect(result.state.mustPlayAgain).toBe(true);
    expect(result.state.currentPlayerIndex).toBe(0);
  });

  it('playing Joker sets mustPlayAgain', () => {
    const c1 = joker('c1');
    const state = buildPlayingState({
      hands: [[c1, card(Rank.Five, Suit.Hearts, 'keep')], [card(Rank.Three, Suit.Hearts, 'o1')], [], []],
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = processAction(state, {
      type: 'PLAY_CARDS',
      playerIndex: 0,
      cardIds: ['c1'],
    });

    expect(result.state.mustPlayAgain).toBe(true);
  });

  it('playing 10 causes blowup', () => {
    const c1 = ten(Suit.Hearts, 'c1');
    const pile = [card(Rank.Five, Suit.Hearts, 'p1')];

    const state = buildPlayingState({
      hands: [[c1, card(Rank.Five, Suit.Hearts, 'keep')], [card(Rank.Three, Suit.Hearts, 'o1')], [], []],
      pile,
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = processAction(state, {
      type: 'PLAY_CARDS',
      playerIndex: 0,
      cardIds: ['c1'],
    });

    expect(result.state.pile).toHaveLength(0);
    expect(result.state.burnPile.length).toBeGreaterThan(0);
    expect(result.state.mustPlayAgain).toBe(true);
    expect(result.events.some((e) => e.type === 'BLOWUP')).toBe(true);
  });

  it('4-of-a-kind causes blowup', () => {
    const c1 = card(Rank.Seven, Suit.Hearts, 'c1');
    const pile = [
      card(Rank.Seven, Suit.Diamonds, 'p1'),
      card(Rank.Seven, Suit.Clubs, 'p2'),
      card(Rank.Seven, Suit.Spades, 'p3'),
    ];

    const state = buildPlayingState({
      hands: [[c1, card(Rank.Five, Suit.Hearts, 'keep')], [card(Rank.Three, Suit.Hearts, 'o1')], [], []],
      pile,
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = processAction(state, {
      type: 'PLAY_CARDS',
      playerIndex: 0,
      cardIds: ['c1'],
    });

    expect(result.state.pile).toHaveLength(0);
    expect(result.state.mustPlayAgain).toBe(true);
    expect(result.events.some((e) => e.type === 'BLOWUP' && e.reason === 'FOUR_OF_A_KIND')).toBe(true);
  });

  it('draws cards after play in HandAndDraw phase', () => {
    const c1 = card(Rank.Seven, Suit.Hearts, 'c1');
    const drawCards = [
      card(Rank.Three, Suit.Hearts, 'd1'),
      card(Rank.Four, Suit.Hearts, 'd2'),
    ];

    const state = buildPlayingState({
      hands: [[c1, card(Rank.Five, Suit.Hearts, 'h2'), card(Rank.Six, Suit.Hearts, 'h3')], [card(Rank.Three, Suit.Diamonds, 'o1')], [], []],
      drawPile: drawCards,
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandAndDraw, PlayerPhase.HandAndDraw, PlayerPhase.HandAndDraw, PlayerPhase.HandAndDraw],
    });

    const result = processAction(state, {
      type: 'PLAY_CARDS',
      playerIndex: 0,
      cardIds: ['c1'],
    });

    // Had 3, played 1 → 2 in hand, draws 1 → 3
    expect(result.state.players[0]!.hand).toHaveLength(3);
  });

  it('advances turn for normal play', () => {
    const c1 = card(Rank.Seven, Suit.Hearts, 'c1');
    const state = buildPlayingState({
      hands: [[c1, card(Rank.Five, Suit.Hearts, 'keep')], [card(Rank.Three, Suit.Hearts, 'o1')], [], []],
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = processAction(state, {
      type: 'PLAY_CARDS',
      playerIndex: 0,
      cardIds: ['c1'],
    });

    expect(result.state.currentPlayerIndex).toBe(1);
  });

  it('throws on invalid play', () => {
    const c1 = card(Rank.Three, Suit.Hearts, 'c1');
    const pile = [card(Rank.King, Suit.Hearts, 'p1')];

    const state = buildPlayingState({
      hands: [[c1], [], [], []],
      pile,
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    expect(() =>
      processAction(state, {
        type: 'PLAY_CARDS',
        playerIndex: 0,
        cardIds: ['c1'],
      })
    ).toThrow();
  });

  it('plays from faceUp zone', () => {
    const c1 = card(Rank.Ace, Suit.Hearts, 'c1');
    const state = buildPlayingState({
      faceUps: [[c1], [], [], []],
      hands: [[], [card(Rank.Three, Suit.Hearts, 'o1')], [], []],
      currentPlayerIndex: 0,
      phases: [PlayerPhase.FaceUp, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = processAction(state, {
      type: 'PLAY_CARDS',
      playerIndex: 0,
      cardIds: ['c1'],
    });

    expect(result.state.players[0]!.faceUp).toHaveLength(0);
    expect(result.state.pile).toHaveLength(1);
  });
});

describe('FLIP_FACE_DOWN', () => {
  it('plays face-down card if playable', () => {
    const fd = card(Rank.Ace, Suit.Hearts, 'fd1');
    const state = buildPlayingState({
      faceDowns: [[fd], [], [], []],
      hands: [[], [card(Rank.Three, Suit.Hearts, 'o1')], [], []],
      pile: [card(Rank.Five, Suit.Hearts, 'p1')],
      currentPlayerIndex: 0,
      phases: [PlayerPhase.FaceDown, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = processAction(state, {
      type: 'FLIP_FACE_DOWN',
      playerIndex: 0,
      slotIndex: 0,
    });

    expect(result.state.pile.length).toBeGreaterThanOrEqual(1);
    expect(result.events.some((e) => e.type === 'FACE_DOWN_FLIPPED' && e.playable)).toBe(true);
  });

  it('picks up pile when face-down card is unplayable', () => {
    const fd = card(Rank.Three, Suit.Hearts, 'fd1');
    const pile = [card(Rank.King, Suit.Hearts, 'p1')];

    const state = buildPlayingState({
      faceDowns: [[fd, card(Rank.Five, Suit.Diamonds, 'fd2')], [], [], []],
      hands: [[], [card(Rank.Three, Suit.Diamonds, 'o1')], [], []],
      pile,
      currentPlayerIndex: 0,
      phases: [PlayerPhase.FaceDown, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = processAction(state, {
      type: 'FLIP_FACE_DOWN',
      playerIndex: 0,
      slotIndex: 0,
    });

    // Player picks up pile + flipped card → hand
    expect(result.state.players[0]!.hand).toHaveLength(2); // pile card + flipped card
    expect(result.state.players[0]!.phase).toBe(PlayerPhase.HandOnly);
    expect(result.state.pile).toHaveLength(0);
  });

  it('blowup from face-down 10', () => {
    const fd = ten(Suit.Hearts, 'fd1');
    const pile = [card(Rank.Five, Suit.Hearts, 'p1')];

    const state = buildPlayingState({
      faceDowns: [[fd], [], [], []],
      hands: [[], [card(Rank.Three, Suit.Hearts, 'o1')], [], []],
      pile,
      currentPlayerIndex: 0,
      phases: [PlayerPhase.FaceDown, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = processAction(state, {
      type: 'FLIP_FACE_DOWN',
      playerIndex: 0,
      slotIndex: 0,
    });

    expect(result.state.pile).toHaveLength(0);
    expect(result.state.burnPile.length).toBeGreaterThan(0);
    expect(result.events.some((e) => e.type === 'BLOWUP')).toBe(true);
  });

  it('last face-down card played wins the game', () => {
    const fd = card(Rank.Ace, Suit.Hearts, 'fd1');

    const state = buildPlayingState({
      faceDowns: [[fd], [], [], []],
      hands: [[], [card(Rank.Three, Suit.Hearts, 'o1')], [], []],
      pile: [card(Rank.Five, Suit.Hearts, 'p1')],
      currentPlayerIndex: 0,
      phases: [PlayerPhase.FaceDown, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = processAction(state, {
      type: 'FLIP_FACE_DOWN',
      playerIndex: 0,
      slotIndex: 0,
    });

    expect(result.state.winnerId).toBe(0);
    expect(result.state.gamePhase).toBe(GamePhase.Finished);
  });

  it('throws on wrong phase', () => {
    const state = buildPlayingState({
      hands: [[card(Rank.Three, Suit.Hearts, 'h1')], [], [], []],
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    expect(() =>
      processAction(state, {
        type: 'FLIP_FACE_DOWN',
        playerIndex: 0,
        slotIndex: 0,
      })
    ).toThrow();
  });
});

describe('PICK_UP_PILE', () => {
  it('moves pile to hand', () => {
    const pile = [
      card(Rank.Five, Suit.Hearts, 'p1'),
      card(Rank.Seven, Suit.Hearts, 'p2'),
    ];

    const state = buildPlayingState({
      hands: [
        [card(Rank.Three, Suit.Hearts, 'h1')],
        [card(Rank.Three, Suit.Diamonds, 'o1')],
        [],
        [],
      ],
      pile,
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = processAction(state, {
      type: 'PICK_UP_PILE',
      playerIndex: 0,
    });

    expect(result.state.players[0]!.hand).toHaveLength(3); // 1 existing + 2 pile
    expect(result.state.pile).toHaveLength(0);
    expect(result.state.currentPlayerIndex).toBe(1);
  });

  it('regresses FaceDown to HandOnly', () => {
    const pile = [card(Rank.Five, Suit.Hearts, 'p1')];

    const state = buildPlayingState({
      faceDowns: [[card(Rank.Three, Suit.Hearts, 'fd1')], [], [], []],
      hands: [[], [card(Rank.Three, Suit.Diamonds, 'o1')], [], []],
      pile,
      currentPlayerIndex: 0,
      phases: [PlayerPhase.FaceDown, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = processAction(state, {
      type: 'PICK_UP_PILE',
      playerIndex: 0,
    });

    expect(result.state.players[0]!.phase).toBe(PlayerPhase.HandOnly);
    expect(result.state.players[0]!.hand).toHaveLength(1);
  });

  it('throws during mustPlayAgain', () => {
    const state = buildPlayingState({
      pile: [card(Rank.Five, Suit.Hearts, 'p1')],
      mustPlayAgain: true,
      currentPlayerIndex: 0,
    });

    expect(() =>
      processAction(state, {
        type: 'PICK_UP_PILE',
        playerIndex: 0,
      })
    ).toThrow(/must-play-again/i);
  });
});

describe('JUMP_IN', () => {
  it('shifts turn to jumper', () => {
    const jumpCard = card(Rank.Seven, Suit.Diamonds, 'ji1');
    const state = buildPlayingState({
      hands: [
        [card(Rank.Three, Suit.Hearts, 'o1')],
        [jumpCard, card(Rank.Five, Suit.Hearts, 'o2')],
        [card(Rank.Three, Suit.Clubs, 'o3')],
        [],
      ],
      pile: [card(Rank.Seven, Suit.Hearts, 'p1')],
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const stateWithWindow = {
      ...state,
      jumpInWindow: { cardRank: Rank.Seven, playedByIndex: 0 },
    };

    const result = processAction(stateWithWindow, {
      type: 'JUMP_IN',
      playerIndex: 1,
      cardIds: ['ji1'],
    });

    expect(result.state.pile).toHaveLength(2);
    // After jump-in, turn advances from jumper (1) → 2
    expect(result.state.currentPlayerIndex).toBe(2);
  });

  it('4-of-a-kind from jump-in causes blowup', () => {
    const ji1 = card(Rank.Seven, Suit.Diamonds, 'ji1');
    const ji2 = card(Rank.Seven, Suit.Clubs, 'ji2');

    const pile = [
      card(Rank.Seven, Suit.Hearts, 'p1'),
      card(Rank.Seven, Suit.Spades, 'p2'),
    ];

    const state = buildPlayingState({
      hands: [
        [card(Rank.Three, Suit.Hearts, 'o1')],
        [ji1, ji2],
        [card(Rank.Three, Suit.Clubs, 'o3')],
        [],
      ],
      pile,
      currentPlayerIndex: 0,
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const stateWithWindow = {
      ...state,
      jumpInWindow: { cardRank: Rank.Seven, playedByIndex: 0 },
    };

    const result = processAction(stateWithWindow, {
      type: 'JUMP_IN',
      playerIndex: 1,
      cardIds: ['ji1', 'ji2'],
    });

    expect(result.state.pile).toHaveLength(0);
    expect(result.state.burnPile.length).toBeGreaterThan(0);
    expect(result.events.some((e) => e.type === 'BLOWUP')).toBe(true);
  });

  it('throws on invalid jump-in', () => {
    const state = buildPlayingState(); // no jump-in window

    expect(() =>
      processAction(state, {
        type: 'JUMP_IN',
        playerIndex: 1,
        cardIds: ['fake'],
      })
    ).toThrow();
  });
});
