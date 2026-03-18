import http from 'http';
import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { ClientMessage, ServerMessage } from '../../src/types/multiplayer';
import { clearAllLobbies } from '../../server/src/lobbyManager';
import { clearAllSessions } from '../../server/src/playerSession';

// Minimal server setup for tests (mirrors server/src/index.ts logic)
let httpServer: http.Server;
let io: Server;
let port: number;

function setupServer(): void {
  httpServer = http.createServer();
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  // Import handlers inline to avoid circular issues
  const { createSession, getSession, getSessionBySocket, markDisconnected, updateSocketId } =
    require('../../server/src/playerSession');
  const lobbyMgr = require('../../server/src/lobbyManager');

  let idCounter = 0;

  io.on('connection', (socket) => {
    const playerId = `test_player_${++idCounter}`;
    const session = createSession(playerId, socket.id);
    socket.emit('message', { type: 'WELCOME', playerId });

    socket.on('message', (msg: ClientMessage) => {
      switch (msg.type) {
        case 'SET_DISPLAY_NAME': {
          const name = msg.displayName.trim().slice(0, 20);
          if (!name) {
            socket.emit('message', { type: 'ERROR', code: 'NAME_REQUIRED', message: 'Name required' });
            return;
          }
          session.displayName = name;
          break;
        }
        case 'CREATE_LOBBY': {
          if (!session.displayName) {
            socket.emit('message', { type: 'ERROR', code: 'NAME_REQUIRED', message: 'Set name first' });
            return;
          }
          const lobby = lobbyMgr.createLobby(session.playerId, session.displayName, msg.config);
          session.lobbyId = lobby.id;
          socket.join(lobby.id);
          socket.emit('message', { type: 'LOBBY_CREATED', lobby: lobbyMgr.toLobbyInfo(lobby) });
          break;
        }
        case 'JOIN_LOBBY': {
          if (!session.displayName) {
            socket.emit('message', { type: 'ERROR', code: 'NAME_REQUIRED', message: 'Set name first' });
            return;
          }
          const target = lobbyMgr.getLobbyByCode(msg.code);
          if (!target) {
            socket.emit('message', { type: 'ERROR', code: 'LOBBY_NOT_FOUND', message: 'Not found' });
            return;
          }
          const result = lobbyMgr.joinLobby(target.id, session.playerId, session.displayName, msg.password);
          if (!result.success) {
            socket.emit('message', { type: 'ERROR', code: result.code, message: result.error });
            return;
          }
          session.lobbyId = target.id;
          socket.join(target.id);
          socket.emit('message', { type: 'LOBBY_JOINED', lobby: lobbyMgr.toLobbyInfo(target) });
          // Broadcast update to room
          const info = lobbyMgr.toLobbyInfo(target);
          socket.to(target.id).emit('message', { type: 'LOBBY_UPDATED', lobby: info });
          break;
        }
        case 'SET_READY': {
          if (!session.lobbyId) return;
          lobbyMgr.setReady(session.lobbyId, session.playerId, msg.ready);
          const lobby = lobbyMgr.getLobby(session.lobbyId);
          if (lobby) {
            const info = lobbyMgr.toLobbyInfo(lobby);
            io.to(lobby.id).emit('message', { type: 'LOBBY_UPDATED', lobby: info });
          }
          break;
        }
        case 'LIST_LOBBIES': {
          const lobbies = lobbyMgr.listPublicLobbies();
          socket.emit('message', {
            type: 'LOBBY_LIST',
            lobbies: lobbies.map(lobbyMgr.toLobbyInfo),
          });
          break;
        }
        case 'LEAVE_LOBBY': {
          if (!session.lobbyId) return;
          const lobbyId = session.lobbyId;
          const lobby = lobbyMgr.getLobby(lobbyId);
          socket.leave(lobbyId);
          session.lobbyId = null;
          if (lobby) {
            lobbyMgr.leaveLobby(lobby.id, session.playerId);
            if (lobby.participants.size > 0) {
              io.to(lobbyId).emit('message', { type: 'LOBBY_UPDATED', lobby: lobbyMgr.toLobbyInfo(lobby) });
            }
          }
          break;
        }
        case 'PING':
          socket.emit('message', { type: 'PONG', timestamp: msg.timestamp, serverTime: Date.now() });
          break;
      }
    });

    socket.on('disconnect', () => {
      const disc = markDisconnected(socket.id);
      if (disc?.lobbyId) {
        const lobby = lobbyMgr.getLobby(disc.lobbyId);
        if (lobby && !lobby.gameInProgress) {
          lobbyMgr.leaveLobby(lobby.id, disc.playerId);
          disc.lobbyId = null;
          if (lobby.participants.size > 0) {
            io.to(lobby.id).emit('message', { type: 'LOBBY_UPDATED', lobby: lobbyMgr.toLobbyInfo(lobby) });
          }
        }
      }
    });
  });
}

function createClient(): ClientSocket {
  return ioClient(`http://localhost:${port}`, {
    transports: ['websocket'],
    reconnection: false,
  });
}

function waitForMessage(client: ClientSocket, type: string, timeout = 2000): Promise<ServerMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${type}`)), timeout);
    const handler = (msg: ServerMessage) => {
      if (msg.type === type) {
        clearTimeout(timer);
        client.off('message', handler);
        resolve(msg);
      }
    };
    client.on('message', handler);
  });
}

beforeAll((done) => {
  setupServer();
  httpServer.listen(0, () => {
    const addr = httpServer.address();
    port = typeof addr === 'object' && addr ? addr.port : 0;
    done();
  });
});

afterAll((done) => {
  io.close();
  httpServer.close(done);
});

beforeEach(() => {
  clearAllLobbies();
  clearAllSessions();
});

describe('Socket.io lobby integration', () => {
  let client1: ClientSocket;
  let client2: ClientSocket;

  afterEach(() => {
    client1?.disconnect();
    client2?.disconnect();
  });

  it('assigns player IDs on connection', async () => {
    client1 = createClient();
    const welcome = await waitForMessage(client1, 'WELCOME');
    expect(welcome.type).toBe('WELCOME');
    if (welcome.type === 'WELCOME') {
      expect(welcome.playerId).toBeTruthy();
    }
  });

  it('responds to ping with pong', async () => {
    client1 = createClient();
    await waitForMessage(client1, 'WELCOME');

    const ts = Date.now();
    client1.emit('message', { type: 'PING', timestamp: ts });
    const pong = await waitForMessage(client1, 'PONG');
    if (pong.type === 'PONG') {
      expect(pong.timestamp).toBe(ts);
      expect(pong.serverTime).toBeGreaterThanOrEqual(ts);
    }
  });

  it('full lobby flow: create, join, ready', async () => {
    client1 = createClient();
    client2 = createClient();

    // Wait for both to be welcomed
    const w1 = await waitForMessage(client1, 'WELCOME');
    const w2 = await waitForMessage(client2, 'WELCOME');

    // Set display names
    client1.emit('message', { type: 'SET_DISPLAY_NAME', displayName: 'Alice' });
    client2.emit('message', { type: 'SET_DISPLAY_NAME', displayName: 'Bob' });

    // Alice creates a lobby
    client1.emit('message', {
      type: 'CREATE_LOBBY',
      config: { maxPlayers: 4, deckCount: 1, includeJokers: true, isPrivate: false },
    });
    const created = await waitForMessage(client1, 'LOBBY_CREATED');
    expect(created.type).toBe('LOBBY_CREATED');

    let lobbyCode = '';
    if (created.type === 'LOBBY_CREATED') {
      lobbyCode = created.lobby.code;
      expect(created.lobby.participants).toHaveLength(1);
      expect(created.lobby.participants[0]!.displayName).toBe('Alice');
    }

    // Bob joins using the code
    client2.emit('message', { type: 'JOIN_LOBBY', code: lobbyCode });
    const joined = await waitForMessage(client2, 'LOBBY_JOINED');
    expect(joined.type).toBe('LOBBY_JOINED');
    if (joined.type === 'LOBBY_JOINED') {
      expect(joined.lobby.participants).toHaveLength(2);
    }

    // Alice should get an update
    const update = await waitForMessage(client1, 'LOBBY_UPDATED');
    if (update.type === 'LOBBY_UPDATED') {
      expect(update.lobby.participants).toHaveLength(2);
    }

    // Both set ready — wait for the update where all are ready
    client1.emit('message', { type: 'SET_READY', ready: true });
    // Wait for client1 to see itself ready
    await waitForMessage(client1, 'LOBBY_UPDATED');

    // Now client2 sets ready — client2 may receive multiple LOBBY_UPDATED messages
    // (one from client1's ready, one from its own). Wait for the one where all are ready.
    const allReadyPromise = new Promise<ServerMessage>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout waiting for all-ready update')), 2000);
      const handler = (msg: ServerMessage) => {
        if (msg.type === 'LOBBY_UPDATED') {
          const allReady = msg.lobby.participants.every((p) => p.isReady);
          if (allReady) {
            clearTimeout(timer);
            client2.off('message', handler);
            resolve(msg);
          }
        }
      };
      client2.on('message', handler);
    });

    client2.emit('message', { type: 'SET_READY', ready: true });
    const readyUpdate = await allReadyPromise;
    if (readyUpdate.type === 'LOBBY_UPDATED') {
      expect(readyUpdate.lobby.participants).toHaveLength(2);
      expect(readyUpdate.lobby.participants.every((p) => p.isReady)).toBe(true);
    }
  });

  it('lobby listing shows public lobbies', async () => {
    client1 = createClient();
    client2 = createClient();
    await waitForMessage(client1, 'WELCOME');
    await waitForMessage(client2, 'WELCOME');

    client1.emit('message', { type: 'SET_DISPLAY_NAME', displayName: 'Alice' });
    client1.emit('message', {
      type: 'CREATE_LOBBY',
      config: { maxPlayers: 4, deckCount: 1, includeJokers: true, isPrivate: false },
    });
    await waitForMessage(client1, 'LOBBY_CREATED');

    // Client 2 lists lobbies
    client2.emit('message', { type: 'LIST_LOBBIES' });
    const list = await waitForMessage(client2, 'LOBBY_LIST');
    if (list.type === 'LOBBY_LIST') {
      expect(list.lobbies.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('requires display name before creating lobby', async () => {
    client1 = createClient();
    await waitForMessage(client1, 'WELCOME');

    client1.emit('message', {
      type: 'CREATE_LOBBY',
      config: { maxPlayers: 4, deckCount: 1, includeJokers: true, isPrivate: false },
    });
    const error = await waitForMessage(client1, 'ERROR');
    if (error.type === 'ERROR') {
      expect(error.code).toBe('NAME_REQUIRED');
    }
  });

  it('handles player disconnect from lobby', async () => {
    client1 = createClient();
    client2 = createClient();
    await waitForMessage(client1, 'WELCOME');
    await waitForMessage(client2, 'WELCOME');

    client1.emit('message', { type: 'SET_DISPLAY_NAME', displayName: 'Alice' });
    client2.emit('message', { type: 'SET_DISPLAY_NAME', displayName: 'Bob' });

    client1.emit('message', {
      type: 'CREATE_LOBBY',
      config: { maxPlayers: 4, deckCount: 1, includeJokers: true, isPrivate: false },
    });
    const created = await waitForMessage(client1, 'LOBBY_CREATED');
    const code = created.type === 'LOBBY_CREATED' ? created.lobby.code : '';

    client2.emit('message', { type: 'JOIN_LOBBY', code });
    await waitForMessage(client2, 'LOBBY_JOINED');
    await waitForMessage(client1, 'LOBBY_UPDATED');

    // Bob disconnects
    client2.disconnect();

    // Alice should see an update with Bob removed
    const update = await waitForMessage(client1, 'LOBBY_UPDATED');
    if (update.type === 'LOBBY_UPDATED') {
      expect(update.lobby.participants).toHaveLength(1);
      expect(update.lobby.participants[0]!.displayName).toBe('Alice');
    }
  });
});
