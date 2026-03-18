export interface PlayerSession {
  readonly playerId: string;
  displayName: string;
  socketId: string | null;
  lobbyId: string | null;
  disconnectedAt: number | null;
}

const sessions = new Map<string, PlayerSession>();
const socketToPlayer = new Map<string, string>();

export function createSession(playerId: string, socketId: string): PlayerSession {
  const session: PlayerSession = {
    playerId,
    displayName: '',
    socketId,
    lobbyId: null,
    disconnectedAt: null,
  };
  sessions.set(playerId, session);
  socketToPlayer.set(socketId, playerId);
  return session;
}

export function getSession(playerId: string): PlayerSession | undefined {
  return sessions.get(playerId);
}

export function getSessionBySocket(socketId: string): PlayerSession | undefined {
  const playerId = socketToPlayer.get(socketId);
  if (!playerId) return undefined;
  return sessions.get(playerId);
}

export function updateSocketId(playerId: string, socketId: string): void {
  const session = sessions.get(playerId);
  if (!session) return;
  // Remove old socket mapping
  if (session.socketId) {
    socketToPlayer.delete(session.socketId);
  }
  session.socketId = socketId;
  session.disconnectedAt = null;
  socketToPlayer.set(socketId, playerId);
}

export function markDisconnected(socketId: string): PlayerSession | undefined {
  const playerId = socketToPlayer.get(socketId);
  if (!playerId) return undefined;
  const session = sessions.get(playerId);
  if (!session) return undefined;
  session.socketId = null;
  session.disconnectedAt = Date.now();
  socketToPlayer.delete(socketId);
  return session;
}

export function removeSession(playerId: string): void {
  const session = sessions.get(playerId);
  if (session?.socketId) {
    socketToPlayer.delete(session.socketId);
  }
  sessions.delete(playerId);
}

export function clearAllSessions(): void {
  sessions.clear();
  socketToPlayer.clear();
}
