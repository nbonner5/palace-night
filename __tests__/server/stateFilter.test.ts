import { Rank, Suit, PlayerPhase } from '../../src/types';
import { card, cards } from '../helpers/cardFactory';
import { buildPlayingState } from '../helpers/stateBuilder';
import { filterStateForPlayer } from '../../server/src/stateFilter';

const seatNames = ['Alice', 'Bob', 'Charlie', 'Dana'];
const seatConnected = [true, true, true, true];

describe('filterStateForPlayer', () => {
  it('includes own hand cards, hides other hands', () => {
    const state = buildPlayingState({
      hands: [
        cards([Rank.Ace, Suit.Spades], [Rank.King, Suit.Hearts]),
        cards([Rank.Queen, Suit.Diamonds], [Rank.Jack, Suit.Clubs]),
        cards([Rank.Ten, Suit.Hearts]),
        cards([Rank.Nine, Suit.Spades], [Rank.Eight, Suit.Diamonds], [Rank.Seven, Suit.Clubs]),
      ],
    });

    const filtered = filterStateForPlayer(state, 0, seatNames, seatConnected, 1);

    // Own hand is fully visible
    expect(filtered.players[0]!.hand).toHaveLength(2);
    expect(filtered.players[0]!.handCount).toBe(2);
    expect(filtered.players[0]!.hand[0]!.rank).toBe(Rank.Ace);

    // Other players' hands are hidden but counts are correct
    expect(filtered.players[1]!.hand).toHaveLength(0);
    expect(filtered.players[1]!.handCount).toBe(2);
    expect(filtered.players[2]!.hand).toHaveLength(0);
    expect(filtered.players[2]!.handCount).toBe(1);
    expect(filtered.players[3]!.hand).toHaveLength(0);
    expect(filtered.players[3]!.handCount).toBe(3);
  });

  it('shows face-up cards for all players', () => {
    const state = buildPlayingState({
      faceUps: [
        cards([Rank.Ten, Suit.Hearts], [Rank.Ace, Suit.Spades]),
        cards([Rank.King, Suit.Diamonds]),
        [],
        cards([Rank.Two, Suit.Clubs]),
      ],
    });

    const filtered = filterStateForPlayer(state, 1, seatNames, seatConnected, 1);

    expect(filtered.players[0]!.faceUp).toHaveLength(2);
    expect(filtered.players[0]!.faceUp[0]!.rank).toBe(Rank.Ten);
    expect(filtered.players[1]!.faceUp).toHaveLength(1);
    expect(filtered.players[2]!.faceUp).toHaveLength(0);
    expect(filtered.players[3]!.faceUp).toHaveLength(1);
  });

  it('hides face-down card values, shows counts', () => {
    const state = buildPlayingState({
      faceDowns: [
        cards([Rank.Ace, Suit.Spades], [Rank.King, Suit.Hearts], [Rank.Queen, Suit.Diamonds]),
        cards([Rank.Jack, Suit.Clubs], [Rank.Ten, Suit.Hearts]),
        [],
        cards([Rank.Nine, Suit.Spades]),
      ],
    });

    const filtered = filterStateForPlayer(state, 0, seatNames, seatConnected, 1);

    // Face-down counts are visible but no card data
    expect(filtered.players[0]!.faceDownCount).toBe(3);
    expect(filtered.players[1]!.faceDownCount).toBe(2);
    expect(filtered.players[2]!.faceDownCount).toBe(0);
    expect(filtered.players[3]!.faceDownCount).toBe(1);
  });

  it('hides draw and burn pile cards, shows counts', () => {
    const state = buildPlayingState({
      drawPile: cards(
        [Rank.Ace, Suit.Spades], [Rank.King, Suit.Hearts], [Rank.Queen, Suit.Diamonds],
        [Rank.Jack, Suit.Clubs], [Rank.Ten, Suit.Hearts]
      ),
      burnPile: cards([Rank.Two, Suit.Clubs], [Rank.Three, Suit.Diamonds]),
    });

    const filtered = filterStateForPlayer(state, 0, seatNames, seatConnected, 1);

    expect(filtered.drawPileCount).toBe(5);
    expect(filtered.burnPileCount).toBe(2);
  });

  it('shows play pile fully', () => {
    const pile = cards([Rank.Five, Suit.Hearts], [Rank.Seven, Suit.Clubs]);
    const state = buildPlayingState({ pile });

    const filtered = filterStateForPlayer(state, 0, seatNames, seatConnected, 1);

    expect(filtered.pile).toHaveLength(2);
    expect(filtered.pile[0]!.rank).toBe(Rank.Five);
    expect(filtered.pile[1]!.rank).toBe(Rank.Seven);
  });

  it('includes metadata fields', () => {
    const state = buildPlayingState({
      currentPlayerIndex: 2,
      mustPlayAgain: true,
      turnNumber: 5,
    });

    const filtered = filterStateForPlayer(state, 1, seatNames, seatConnected, 42);

    expect(filtered.yourSeatIndex).toBe(1);
    expect(filtered.currentPlayerIndex).toBe(2);
    expect(filtered.mustPlayAgain).toBe(true);
    expect(filtered.turnNumber).toBe(5);
    expect(filtered.stateVersion).toBe(42);
    expect(filtered.seatNames).toEqual(seatNames);
    expect(filtered.seatConnected).toEqual(seatConnected);
  });

  it('includes player phases', () => {
    const state = buildPlayingState({
      phases: [PlayerPhase.FaceDown, PlayerPhase.HandOnly, PlayerPhase.FaceUp, PlayerPhase.HandAndDraw],
    });

    const filtered = filterStateForPlayer(state, 0, seatNames, seatConnected, 1);

    expect(filtered.players[0]!.phase).toBe(PlayerPhase.FaceDown);
    expect(filtered.players[1]!.phase).toBe(PlayerPhase.HandOnly);
    expect(filtered.players[2]!.phase).toBe(PlayerPhase.FaceUp);
    expect(filtered.players[3]!.phase).toBe(PlayerPhase.HandAndDraw);
  });

  it('filters differently per viewer', () => {
    const state = buildPlayingState({
      hands: [
        cards([Rank.Ace, Suit.Spades]),
        cards([Rank.King, Suit.Hearts]),
        cards([Rank.Queen, Suit.Diamonds]),
        cards([Rank.Jack, Suit.Clubs]),
      ],
    });

    const forPlayer0 = filterStateForPlayer(state, 0, seatNames, seatConnected, 1);
    const forPlayer1 = filterStateForPlayer(state, 1, seatNames, seatConnected, 1);

    // Player 0 sees own hand, not player 1's
    expect(forPlayer0.players[0]!.hand).toHaveLength(1);
    expect(forPlayer0.players[1]!.hand).toHaveLength(0);

    // Player 1 sees own hand, not player 0's
    expect(forPlayer1.players[0]!.hand).toHaveLength(0);
    expect(forPlayer1.players[1]!.hand).toHaveLength(1);

    expect(forPlayer0.yourSeatIndex).toBe(0);
    expect(forPlayer1.yourSeatIndex).toBe(1);
  });

  it('preserves jump-in window', () => {
    const state = buildPlayingState();
    const stateWithJumpIn = {
      ...state,
      jumpInWindow: { cardRank: Rank.Seven, playedByIndex: 1 },
    };

    const filtered = filterStateForPlayer(stateWithJumpIn, 0, seatNames, seatConnected, 1);

    expect(filtered.jumpInWindow).toEqual({ cardRank: Rank.Seven, playedByIndex: 1 });
  });

  it('preserves winnerId', () => {
    const state = buildPlayingState();
    const finishedState = { ...state, winnerId: 2 };

    const filtered = filterStateForPlayer(finishedState, 0, seatNames, seatConnected, 1);

    expect(filtered.winnerId).toBe(2);
  });
});
