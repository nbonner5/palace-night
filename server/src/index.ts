import http from 'http';
import { Server, Socket } from 'socket.io';
import { nanoid } from 'nanoid';
import { ClientMessage, ServerMessage, ErrorCode } from '../../src/types/multiplayer';
import {
  createSession,
  getSession,
  markDisconnected,
  updateSocketId,
  PlayerSession,
} from './playerSession';
import {
  createLobby,
  getLobby,
  getLobbyByCode,
  joinLobby,
  leaveLobby,
  setReady,
  canStartGame,
  listPublicLobbies,
  toLobbyInfo,
  Lobby,
} from './lobbyManager';
import { GameRoom } from './gameRoom';

const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3001;
const RECONNECT_TIMEOUT_MS = 30_000;

// Active game rooms indexed by lobbyId
const gameRooms = new Map<string, GameRoom>();
// Disconnect timers for players (playerId -> timeout)
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
// Rematch ready sets per lobby
const rematchReady = new Map<string, Set<string>>();
// Persisted leaderboards per lobby (survives across rematches)
const lobbyLeaderboards = new Map<string, Record<number, number>>();

const httpServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

function sendToSocket(socketId: string, msg: ServerMessage): void {
  const sock = io.sockets.sockets.get(socketId);
  if (sock) sock.emit('message', msg);
}

function sendMessage(socket: Socket, msg: ServerMessage): void {
  socket.emit('message', msg);
}

function sendError(socket: Socket, code: ErrorCode, message: string): void {
  sendMessage(socket, { type: 'ERROR', code, message });
}

function broadcastLobbyUpdate(lobby: Lobby): void {
  const info = toLobbyInfo(lobby);
  for (const p of lobby.participants.values()) {
    const session = getSession(p.playerId);
    if (session?.socketId) {
      sendToSocket(session.socketId, { type: 'LOBBY_UPDATED', lobby: info });
    }
  }
}

function getSocketForPlayer(playerId: string): Socket | undefined {
  const session = getSession(playerId);
  if (!session?.socketId) return undefined;
  return io.sockets.sockets.get(session.socketId);
}

// ── Game Room Management ──

function createBroadcastFn(room: GameRoom): (seatIndex: number, msg: ServerMessage) => void {
  return (seatIndex: number, msg: ServerMessage) => {
    // Find the player at this seat and send them the message
    const state = room.getState();
    // We need to look up who's at this seat. Use the room's internal mapping.
    // The room tracks seats, but we need to find the session for that seat.
    // We'll iterate sessions to find the one in this lobby with matching seat.
    for (const [, entry] of gameRooms) {
      if (entry === room) {
        // Found our room — now find the player at seatIndex
        // We need to check all sessions in the lobby
        const lobby = getLobby(room.lobbyId);
        if (!lobby) return;
        for (const p of lobby.participants.values()) {
          if (p.seatIndex === seatIndex) {
            const session = getSession(p.playerId);
            if (session?.socketId) {
              sendToSocket(session.socketId, msg);
            }
            return;
          }
        }
        // Not a lobby participant at that seat — might be a CPU or the seat mapping is different
        // Fall back: iterate all sessions looking for someone in this lobby at this seat
        return;
      }
    }
  };
}

function startGame(lobby: Lobby): void {
  const broadcastFn = (seatIndex: number, msg: ServerMessage) => {
    // Look up which player is at this seat
    for (const p of lobby.participants.values()) {
      if (p.seatIndex === seatIndex) {
        const session = getSession(p.playerId);
        if (session?.socketId) {
          sendToSocket(session.socketId, msg);
        }
        return;
      }
    }
  };

  const room = new GameRoom(lobby, broadcastFn);
  gameRooms.set(lobby.id, room);
  lobby.gameInProgress = true;

  // Send initial state to all participants
  for (const p of lobby.participants.values()) {
    const seatIndex = room.getSeatIndex(p.playerId);
    if (seatIndex !== -1) {
      const session = getSession(p.playerId);
      if (session?.socketId) {
        sendToSocket(session.socketId, {
          type: 'GAME_STARTED',
          state: room.getFilteredState(seatIndex),
        });
      }
    }
  }

  // Start game timers
  room.start();
}

// ── Message Handlers ──

function handleSetDisplayName(socket: Socket, session: PlayerSession, msg: ClientMessage & { type: 'SET_DISPLAY_NAME' }): void {
  const name = msg.displayName.trim().slice(0, 20);
  if (!name) {
    sendError(socket, 'NAME_REQUIRED', 'Display name cannot be empty');
    return;
  }
  session.displayName = name;
}

function handleCreateLobby(socket: Socket, session: PlayerSession, msg: ClientMessage & { type: 'CREATE_LOBBY' }): void {
  if (!session.displayName) {
    sendError(socket, 'NAME_REQUIRED', 'Set a display name first');
    return;
  }
  if (session.lobbyId) {
    handleLeaveLobby(socket, session);
  }

  const lobby = createLobby(session.playerId, session.displayName, msg.config);
  session.lobbyId = lobby.id;
  socket.join(lobby.id);
  sendMessage(socket, { type: 'LOBBY_CREATED', lobby: toLobbyInfo(lobby) });
}

function handleJoinLobby(socket: Socket, session: PlayerSession, msg: ClientMessage & { type: 'JOIN_LOBBY' }): void {
  if (!session.displayName) {
    sendError(socket, 'NAME_REQUIRED', 'Set a display name first');
    return;
  }
  const lobby = getLobbyByCode(msg.code);
  if (!lobby) {
    sendError(socket, 'LOBBY_NOT_FOUND', 'Lobby not found');
    return;
  }

  const result = joinLobby(lobby.id, session.playerId, session.displayName, msg.password);
  if (!result.success) {
    sendError(socket, result.code as ErrorCode, result.error);
    return;
  }

  if (session.lobbyId && session.lobbyId !== lobby.id) {
    handleLeaveLobby(socket, session);
  }

  session.lobbyId = lobby.id;
  socket.join(lobby.id);
  sendMessage(socket, { type: 'LOBBY_JOINED', lobby: toLobbyInfo(lobby) });
  broadcastLobbyUpdate(lobby);
}

function handleLeaveLobby(socket: Socket, session: PlayerSession): void {
  if (!session.lobbyId) {
    sendError(socket, 'NOT_IN_LOBBY', 'Not in a lobby');
    return;
  }

  const lobby = getLobby(session.lobbyId);
  socket.leave(session.lobbyId);
  session.lobbyId = null;

  if (!lobby) return;

  const result = leaveLobby(lobby.id, session.playerId);

  if (!result.deleted) {
    if (result.newHostId) {
      const newHost = lobby.participants.get(result.newHostId);
      if (newHost) {
        broadcastLobbyUpdate(lobby);
        for (const p of lobby.participants.values()) {
          const s = getSession(p.playerId);
          if (s?.socketId) {
            sendToSocket(s.socketId, {
              type: 'HOST_CHANGED',
              newHostId: result.newHostId,
              newHostName: newHost.displayName,
            });
          }
        }
      }
    } else {
      broadcastLobbyUpdate(lobby);
    }
  }
}

function handleSetReady(socket: Socket, session: PlayerSession, msg: ClientMessage & { type: 'SET_READY' }): void {
  if (!session.lobbyId) {
    sendError(socket, 'NOT_IN_LOBBY', 'Not in a lobby');
    return;
  }
  setReady(session.lobbyId, session.playerId, msg.ready);
  const lobby = getLobby(session.lobbyId);
  if (lobby) {
    broadcastLobbyUpdate(lobby);

    // Check if game should start
    if (canStartGame(lobby) && !lobby.gameInProgress) {
      startGame(lobby);
    }
  }
}

function handleListLobbies(socket: Socket): void {
  const lobbies = listPublicLobbies();
  sendMessage(socket, {
    type: 'LOBBY_LIST',
    lobbies: lobbies.map(toLobbyInfo),
  });
}

function handlePing(socket: Socket, msg: ClientMessage & { type: 'PING' }): void {
  sendMessage(socket, {
    type: 'PONG',
    timestamp: msg.timestamp,
    serverTime: Date.now(),
  });
}

function handleRevealFaceDown(socket: Socket, session: PlayerSession, msg: ClientMessage & { type: 'REVEAL_FACE_DOWN' }): void {
  if (!session.lobbyId) {
    sendError(socket, 'NOT_IN_LOBBY', 'Not in a game');
    return;
  }

  const room = gameRooms.get(session.lobbyId);
  if (!room) {
    sendError(socket, 'INVALID_ACTION', 'No active game');
    return;
  }

  const result = room.handleRevealFaceDown(session.playerId, msg.slotIndex, msg.stateVersion);
  if (!result.success) {
    sendError(socket, 'INVALID_ACTION', result.error ?? 'Reveal failed');
    return;
  }

  sendMessage(socket, {
    type: 'FACE_DOWN_REVEALED',
    card: result.card!,
    playable: result.playable!,
    slotIndex: result.slotIndex!,
  });
}

function handleGameAction(socket: Socket, session: PlayerSession, msg: ClientMessage & { type: 'GAME_ACTION' }): void {
  if (!session.lobbyId) {
    sendError(socket, 'NOT_IN_LOBBY', 'Not in a game');
    return;
  }

  const room = gameRooms.get(session.lobbyId);
  if (!room) {
    sendError(socket, 'INVALID_ACTION', 'No active game');
    return;
  }

  const result = room.handleAction(session.playerId, msg.action, msg.stateVersion);
  if (!result.success) {
    sendError(socket, 'INVALID_ACTION', result.error ?? 'Action failed');
  }
}

function handleSetRematchReady(socket: Socket, session: PlayerSession, msg: ClientMessage & { type: 'SET_REMATCH_READY' }): void {
  if (!session.lobbyId) {
    sendError(socket, 'NOT_IN_LOBBY', 'Not in a lobby');
    return;
  }

  const room = gameRooms.get(session.lobbyId);
  if (!room || !room.isFinished()) {
    sendError(socket, 'INVALID_ACTION', 'Game is not finished');
    return;
  }

  const lobby = getLobby(session.lobbyId);
  if (!lobby) return;

  let readySet = rematchReady.get(session.lobbyId);
  if (!readySet) {
    readySet = new Set();
    rematchReady.set(session.lobbyId, readySet);
  }

  if (msg.ready) {
    readySet.add(session.playerId);
  } else {
    readySet.delete(session.playerId);
  }

  // Count connected humans in the lobby
  const connectedHumans: string[] = [];
  for (const p of lobby.participants.values()) {
    const s = getSession(p.playerId);
    if (s?.socketId) {
      connectedHumans.push(p.playerId);
    }
  }

  // Build per-player info for broadcast
  const rematchPlayers = connectedHumans.map((pid) => {
    const seatIdx = room.getSeatIndex(pid);
    const pSession = getSession(pid);
    return {
      seatIndex: seatIdx,
      displayName: pSession?.displayName ?? 'Unknown',
      isReady: readySet!.has(pid),
    };
  });

  for (const pid of connectedHumans) {
    const s = getSession(pid);
    if (s?.socketId) {
      sendToSocket(s.socketId, {
        type: 'REMATCH_UPDATE',
        players: rematchPlayers,
        lobbyCode: lobby.code,
        yourSeatIndex: room.getSeatIndex(pid),
      });
    }
  }

  // Check if all connected humans are ready
  if (readySet.size >= connectedHumans.length && connectedHumans.length > 0) {
    // Save leaderboard from current game
    const currentLeaderboard = room.getLeaderboard();
    lobbyLeaderboards.set(session.lobbyId, currentLeaderboard);

    // Stop old game
    room.stop();
    rematchReady.delete(session.lobbyId);

    // Start new game with persisted leaderboard
    const broadcastFn = (seatIndex: number, broadcastMsg: ServerMessage) => {
      for (const p of lobby.participants.values()) {
        if (p.seatIndex === seatIndex) {
          const s = getSession(p.playerId);
          if (s?.socketId) sendToSocket(s.socketId, broadcastMsg);
          return;
        }
      }
    };

    const newRoom = new GameRoom(lobby, broadcastFn, currentLeaderboard);
    gameRooms.set(lobby.id, newRoom);

    // Send REMATCH_STARTED to all participants
    for (const p of lobby.participants.values()) {
      const seatIndex = newRoom.getSeatIndex(p.playerId);
      if (seatIndex !== -1) {
        const s = getSession(p.playerId);
        if (s?.socketId) {
          sendToSocket(s.socketId, {
            type: 'REMATCH_STARTED',
            state: newRoom.getFilteredState(seatIndex),
          });
        }
      }
    }

    newRoom.start();
  }
}

function handleReconnect(socket: Socket, msg: ClientMessage & { type: 'RECONNECT' }): void {
  const existingSession = getSession(msg.playerId);
  if (!existingSession) {
    sendError(socket, 'RECONNECT_FAILED', 'Session not found');
    return;
  }

  // Cancel disconnect timer
  const timer = disconnectTimers.get(msg.playerId);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(msg.playerId);
  }

  updateSocketId(msg.playerId, socket.id);
  sendMessage(socket, { type: 'WELCOME', playerId: msg.playerId });

  // Rejoin lobby room
  if (existingSession.lobbyId) {
    socket.join(existingSession.lobbyId);
    const lobby = getLobby(existingSession.lobbyId);

    // Check for active game
    const room = gameRooms.get(existingSession.lobbyId);
    if (room) {
      const seatIndex = room.markReconnected(msg.playerId);
      if (seatIndex !== -1) {
        // Send current game state
        sendMessage(socket, {
          type: 'GAME_STATE_UPDATE',
          state: room.getFilteredState(seatIndex),
          events: [],
        });

        // Notify others
        broadcastToRoom(room, existingSession.lobbyId, {
          type: 'PLAYER_RECONNECTED',
          playerId: msg.playerId,
          displayName: existingSession.displayName,
          seatIndex,
        });
      }
    } else if (lobby) {
      sendMessage(socket, { type: 'LOBBY_JOINED', lobby: toLobbyInfo(lobby) });
    }
  }
}

function broadcastToRoom(room: GameRoom, lobbyId: string, msg: ServerMessage): void {
  const lobby = getLobby(lobbyId);
  if (!lobby) return;
  for (const p of lobby.participants.values()) {
    const session = getSession(p.playerId);
    if (session?.socketId) {
      sendToSocket(session.socketId, msg);
    }
  }
}

function handleDisconnectDuringGame(session: PlayerSession, lobbyId: string): void {
  const room = gameRooms.get(lobbyId);
  if (!room) return;

  const seatIndex = room.markDisconnected(session.playerId);
  if (seatIndex === -1) return;

  // Notify other players
  broadcastToRoom(room, lobbyId, {
    type: 'PLAYER_DISCONNECTED',
    playerId: session.playerId,
    displayName: session.displayName,
    seatIndex,
  });

  // Start 30s reconnect timer
  const timer = setTimeout(() => {
    disconnectTimers.delete(session.playerId);
    room.convertToCpu(session.playerId);

    // Notify room that player is permanently gone
    broadcastToRoom(room, lobbyId, {
      type: 'GAME_STATE_UPDATE',
      state: room.getFilteredState(0), // Generic view for notification
      events: [],
    });
  }, RECONNECT_TIMEOUT_MS);
  disconnectTimers.set(session.playerId, timer);
}

// ── Socket Connection Handler ──

io.on('connection', (socket) => {
  const playerId = nanoid();
  const session = createSession(playerId, socket.id);
  sendMessage(socket, { type: 'WELCOME', playerId });

  socket.on('message', (msg: ClientMessage) => {
    switch (msg.type) {
      case 'SET_DISPLAY_NAME':
        handleSetDisplayName(socket, session, msg);
        break;
      case 'CREATE_LOBBY':
        handleCreateLobby(socket, session, msg);
        break;
      case 'JOIN_LOBBY':
        handleJoinLobby(socket, session, msg);
        break;
      case 'LEAVE_LOBBY':
        handleLeaveLobby(socket, session);
        break;
      case 'SET_READY':
        handleSetReady(socket, session, msg);
        break;
      case 'LIST_LOBBIES':
        handleListLobbies(socket);
        break;
      case 'PING':
        handlePing(socket, msg);
        break;
      case 'GAME_ACTION':
        handleGameAction(socket, session, msg);
        break;
      case 'REVEAL_FACE_DOWN':
        handleRevealFaceDown(socket, session, msg);
        break;
      case 'RECONNECT':
        handleReconnect(socket, msg);
        break;
      case 'SET_REMATCH_READY':
        handleSetRematchReady(socket, session, msg);
        break;
    }
  });

  socket.on('disconnect', () => {
    const disconnected = markDisconnected(socket.id);
    if (!disconnected?.lobbyId) return;

    const lobby = getLobby(disconnected.lobbyId);
    if (!lobby) return;

    if (lobby.gameInProgress) {
      // Game in progress — start reconnect timer
      handleDisconnectDuringGame(disconnected, disconnected.lobbyId);
    } else {
      // In lobby only — leave immediately
      leaveLobby(lobby.id, disconnected.playerId);
      disconnected.lobbyId = null;
      if (lobby.participants.size > 0) {
        broadcastLobbyUpdate(lobby);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Palace Night server listening on port ${PORT}`);
});

export { io, httpServer, gameRooms, disconnectTimers };
