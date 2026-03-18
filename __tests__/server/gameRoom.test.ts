import { GamePhase, Rank, Suit } from '../../src/types';
import { ServerMessage } from '../../src/types/multiplayer';
import { GameRoom, BroadcastFn } from '../../server/src/gameRoom';
import { Lobby, clearAllLobbies, createLobby, joinLobby, setReady } from '../../server/src/lobbyManager';

function makeLobby(playerCount: number = 2): Lobby {
  const lobby = createLobby('host', 'Alice', { maxPlayers: playerCount });
  for (let i = 1; i < playerCount; i++) {
    joinLobby(lobby.id, `p${i}`, `Player${i}`);
  }
  // Set all ready
  setReady(lobby.id, 'host', true);
  for (let i = 1; i < playerCount; i++) {
    setReady(lobby.id, `p${i}`, true);
  }
  return lobby;
}

describe('GameRoom', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    clearAllLobbies();
  });
  afterEach(() => {
    jest.useRealTimers();
    clearAllLobbies();
  });

  it('creates a game with correct player count', () => {
    const lobby = makeLobby(3);
    const messages: Array<{ seat: number; msg: ServerMessage }> = [];
    const broadcast: BroadcastFn = (seat, msg) => messages.push({ seat, msg });

    const room = new GameRoom(lobby, broadcast);
    const state = room.getState();

    expect(state.players).toHaveLength(3);
    expect(room.getVersion()).toBeGreaterThan(0);

    room.stop();
  });

  it('maps players to correct seats', () => {
    const lobby = makeLobby(2);
    const broadcast: BroadcastFn = jest.fn();
    const room = new GameRoom(lobby, broadcast);

    expect(room.getSeatIndex('host')).toBe(0);
    expect(room.getSeatIndex('p1')).toBe(1);
    expect(room.getSeatIndex('unknown')).toBe(-1);

    room.stop();
  });

  it('fills empty seats with CPU', () => {
    const lobby = createLobby('host', 'Alice', { maxPlayers: 4 });
    joinLobby(lobby.id, 'p1', 'Bob');
    setReady(lobby.id, 'host', true);
    setReady(lobby.id, 'p1', true);

    const broadcast: BroadcastFn = jest.fn();
    const room = new GameRoom(lobby, broadcast);

    // Seats 2 and 3 should be CPU
    expect(room.isCpuSeat(2)).toBe(true);
    expect(room.isCpuSeat(3)).toBe(true);
    expect(room.isCpuSeat(0)).toBe(false);
    expect(room.isCpuSeat(1)).toBe(false);

    room.stop();
  });

  it('returns filtered state per player', () => {
    const lobby = makeLobby(2);
    const broadcast: BroadcastFn = jest.fn();
    const room = new GameRoom(lobby, broadcast);

    const state0 = room.getFilteredState(0);
    const state1 = room.getFilteredState(1);

    expect(state0.yourSeatIndex).toBe(0);
    expect(state1.yourSeatIndex).toBe(1);
    // Own hand visible, other's hidden
    expect(state0.players[0]!.hand.length).toBeGreaterThan(0);
    expect(state0.players[1]!.hand).toHaveLength(0);
    expect(state1.players[1]!.hand.length).toBeGreaterThan(0);
    expect(state1.players[0]!.hand).toHaveLength(0);

    room.stop();
  });

  it('processes valid human actions', () => {
    const lobby = makeLobby(2);
    const messages: Array<{ seat: number; msg: ServerMessage }> = [];
    const broadcast: BroadcastFn = (seat, msg) => messages.push({ seat, msg });
    const room = new GameRoom(lobby, broadcast);

    // Get state — if it's setup phase and human's turn, choose face-up cards
    const state = room.getState();
    if (state.gamePhase === GamePhase.Setup) {
      const currentPlayer = state.players[state.currentPlayerIndex]!;
      if (!room.isCpuSeat(state.currentPlayerIndex)) {
        const cardIds = currentPlayer.hand.slice(0, 3).map((c) => c.id);
        const result = room.handleAction(
          state.currentPlayerIndex === 0 ? 'host' : 'p1',
          { type: 'CHOOSE_FACE_UP', playerIndex: state.currentPlayerIndex, cardIds },
          room.getVersion()
        );
        expect(result.success).toBe(true);
      }
    }

    room.stop();
  });

  it('rejects actions with stale version', () => {
    const lobby = makeLobby(2);
    const broadcast: BroadcastFn = jest.fn();
    const room = new GameRoom(lobby, broadcast);

    const result = room.handleAction('host', {
      type: 'PLAY_CARDS',
      playerIndex: 0,
      cardIds: ['fake'],
    }, 0); // version 0, stale

    expect(result.success).toBe(false);
    expect(result.error).toContain('Stale');

    room.stop();
  });

  it('rejects actions from non-participants', () => {
    const lobby = makeLobby(2);
    const broadcast: BroadcastFn = jest.fn();
    const room = new GameRoom(lobby, broadcast);

    const result = room.handleAction('stranger', {
      type: 'PLAY_CARDS',
      playerIndex: 0,
      cardIds: ['fake'],
    }, room.getVersion());

    expect(result.success).toBe(false);
    expect(result.error).toContain('Not in this game');

    room.stop();
  });

  it('marks player as disconnected', () => {
    const lobby = makeLobby(2);
    const broadcast: BroadcastFn = jest.fn();
    const room = new GameRoom(lobby, broadcast);

    const seatIndex = room.markDisconnected('p1');
    expect(seatIndex).toBe(1);
    expect(room.isCpuSeat(1)).toBe(true); // Disconnected = CPU takes over

    room.stop();
  });

  it('marks player as reconnected', () => {
    const lobby = makeLobby(2);
    const broadcast: BroadcastFn = jest.fn();
    const room = new GameRoom(lobby, broadcast);

    room.markDisconnected('p1');
    expect(room.isCpuSeat(1)).toBe(true);

    room.markReconnected('p1');
    expect(room.isCpuSeat(1)).toBe(false);

    room.stop();
  });

  it('converts seat permanently to CPU', () => {
    const lobby = makeLobby(2);
    const broadcast: BroadcastFn = jest.fn();
    const room = new GameRoom(lobby, broadcast);

    room.convertToCpu('p1');
    expect(room.isCpuSeat(1)).toBe(true);
    expect(room.getSeatIndex('p1')).toBe(-1); // No longer mapped

    room.stop();
  });
});
