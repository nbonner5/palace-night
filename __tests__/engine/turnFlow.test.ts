import { drawCards, checkPhaseTransition, advanceTurn, checkWin } from '../../src/engine/turnFlow';
import { Rank, Suit, PlayerPhase, GamePhase } from '../../src/types';
import { card } from '../helpers/cardFactory';
import { buildPlayingState } from '../helpers/stateBuilder';

beforeEach(() => {
  require('../helpers/cardFactory').resetIdCounter();
});

describe('drawCards', () => {
  it('draws to maintain 3 in hand', () => {
    const drawPile = [
      card(Rank.Five, Suit.Hearts, 'd1'),
      card(Rank.Six, Suit.Hearts, 'd2'),
      card(Rank.Seven, Suit.Hearts, 'd3'),
    ];

    const state = buildPlayingState({
      hands: [[card(Rank.Three, Suit.Hearts, 'h1')], [], [], []],
      drawPile,
      phases: [PlayerPhase.HandAndDraw, PlayerPhase.HandAndDraw, PlayerPhase.HandAndDraw, PlayerPhase.HandAndDraw],
    });

    const result = drawCards(state, 0);
    expect(result.state.players[0].hand).toHaveLength(3);
    expect(result.state.drawPile).toHaveLength(1);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({ type: 'CARD_DRAWN', count: 2 });
  });

  it('draws partial when pile is small', () => {
    const state = buildPlayingState({
      hands: [[], [], [], []],
      drawPile: [card(Rank.Five, Suit.Hearts, 'd1')],
      phases: [PlayerPhase.HandAndDraw, PlayerPhase.HandAndDraw, PlayerPhase.HandAndDraw, PlayerPhase.HandAndDraw],
    });

    const result = drawCards(state, 0);
    expect(result.state.players[0].hand).toHaveLength(1);
    expect(result.state.drawPile).toHaveLength(0);
  });

  it('does not draw when hand >= 3', () => {
    const hand = [
      card(Rank.Three, Suit.Hearts, 'h1'),
      card(Rank.Four, Suit.Hearts, 'h2'),
      card(Rank.Five, Suit.Hearts, 'h3'),
    ];
    const state = buildPlayingState({
      hands: [hand, [], [], []],
      drawPile: [card(Rank.Six, Suit.Hearts, 'd1')],
      phases: [PlayerPhase.HandAndDraw, PlayerPhase.HandAndDraw, PlayerPhase.HandAndDraw, PlayerPhase.HandAndDraw],
    });

    const result = drawCards(state, 0);
    expect(result.state.players[0].hand).toHaveLength(3);
    expect(result.state.drawPile).toHaveLength(1);
    expect(result.events).toHaveLength(0);
  });

  it('does not draw when not in HandAndDraw phase', () => {
    const state = buildPlayingState({
      hands: [[], [], [], []],
      drawPile: [card(Rank.Five, Suit.Hearts, 'd1')],
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandAndDraw, PlayerPhase.HandAndDraw, PlayerPhase.HandAndDraw],
    });

    const result = drawCards(state, 0);
    expect(result.state.players[0].hand).toHaveLength(0);
    expect(result.events).toHaveLength(0);
  });
});

describe('checkPhaseTransition', () => {
  it('transitions all HandAndDraw players to HandOnly when draw pile empties', () => {
    const state = buildPlayingState({
      hands: [
        [card(Rank.Three, Suit.Hearts, 'h1')],
        [card(Rank.Four, Suit.Hearts, 'h2')],
        [],
        [],
      ],
      drawPile: [],
      phases: [PlayerPhase.HandAndDraw, PlayerPhase.HandAndDraw, PlayerPhase.HandOnly, PlayerPhase.FaceDown],
    });

    const result = checkPhaseTransition(state, 0);
    expect(result.state.players[0].phase).toBe(PlayerPhase.HandOnly);
    expect(result.state.players[1].phase).toBe(PlayerPhase.HandOnly);
    expect(result.state.players[2].phase).toBe(PlayerPhase.HandOnly);
    expect(result.state.players[3].phase).toBe(PlayerPhase.FaceDown);
  });

  it('picks up faceUp into hand when hand is empty', () => {
    const faceUpCards = [
      card(Rank.Ace, Suit.Hearts, 'fu1'),
      card(Rank.King, Suit.Hearts, 'fu2'),
      card(Rank.Queen, Suit.Hearts, 'fu3'),
    ];
    const state = buildPlayingState({
      hands: [[], [], [], []],
      faceUps: [faceUpCards, [], [], []],
      drawPile: [],
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = checkPhaseTransition(state, 0);
    expect(result.state.players[0].hand).toHaveLength(3);
    expect(result.state.players[0].faceUp).toHaveLength(0);
    expect(result.state.players[0].phase).toBe(PlayerPhase.HandOnly);
  });

  it('transitions to FaceDown when hand and faceUp are empty', () => {
    const state = buildPlayingState({
      hands: [[], [], [], []],
      faceDowns: [[card(Rank.Five, Suit.Hearts, 'fd1')], [], [], []],
      drawPile: [],
      phases: [PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly, PlayerPhase.HandOnly],
    });

    const result = checkPhaseTransition(state, 0);
    expect(result.state.players[0].phase).toBe(PlayerPhase.FaceDown);
  });
});

describe('advanceTurn', () => {
  it('advances clockwise 0→1→2→3→0', () => {
    for (let i = 0; i < 4; i++) {
      const state = buildPlayingState({
        currentPlayerIndex: i,
        hands: [
          [card(Rank.Three, Suit.Hearts, `h${i}0`)],
          [card(Rank.Three, Suit.Hearts, `h${i}1`)],
          [card(Rank.Three, Suit.Hearts, `h${i}2`)],
          [card(Rank.Three, Suit.Hearts, `h${i}3`)],
        ],
      });

      const result = advanceTurn(state);
      expect(result.state.currentPlayerIndex).toBe((i + 1) % 4);
    }
  });

  it('does not advance when mustPlayAgain', () => {
    const state = buildPlayingState({
      currentPlayerIndex: 0,
      mustPlayAgain: true,
      hands: [
        [card(Rank.Three, Suit.Hearts, 'h1')],
        [card(Rank.Three, Suit.Hearts, 'h2')],
        [],
        [],
      ],
    });

    const result = advanceTurn(state);
    expect(result.state.currentPlayerIndex).toBe(0);
    expect(result.state.mustPlayAgain).toBe(false);
  });

  it('skips players with no cards', () => {
    const state = buildPlayingState({
      currentPlayerIndex: 0,
      hands: [
        [card(Rank.Three, Suit.Hearts, 'h1')],
        [], // player 1 is empty
        [card(Rank.Five, Suit.Hearts, 'h3')],
        [],
      ],
    });

    const result = advanceTurn(state);
    expect(result.state.currentPlayerIndex).toBe(2);
  });
});

describe('checkWin', () => {
  it('detects win when all cards empty', () => {
    const state = buildPlayingState({
      hands: [[], [], [], []],
      faceUps: [[], [], [], []],
      faceDowns: [[], [], [], []],
    });

    const result = checkWin(state, 0);
    expect(result.winnerId).toBe(0);
    expect(result.gamePhase).toBe(GamePhase.Finished);
  });

  it('does not detect win when cards remain', () => {
    const state = buildPlayingState({
      hands: [[card(Rank.Three, Suit.Hearts, 'h1')], [], [], []],
    });

    const result = checkWin(state, 0);
    expect(result.winnerId).toBeNull();
  });

  it('detects win for any player', () => {
    const state = buildPlayingState({
      hands: [[card(Rank.Three, Suit.Hearts, 'h1')], [], [], []],
    });

    const result = checkWin(state, 2);
    expect(result.winnerId).toBe(2);
  });
});
