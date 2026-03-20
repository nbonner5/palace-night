import { LobbyConfig, LobbyInfo, LobbyParticipant, DEFAULT_LOBBY_CONFIG } from '../../src/types/multiplayer';

// Characters excluding ambiguous ones (I, O, 0, 1)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

export interface Lobby {
  id: string;
  code: string;
  config: LobbyConfig;
  participants: Map<string, LobbyParticipant>; // playerId -> participant
  hostId: string;
  createdAt: number;
  gameInProgress: boolean;
}

const lobbies = new Map<string, Lobby>();
const codeToId = new Map<string, string>();
let idCounter = 0;

function generateCode(): string {
  let code: string;
  do {
    code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
  } while (codeToId.has(code));
  return code;
}

export function createLobby(
  hostId: string,
  hostName: string,
  config: Partial<LobbyConfig> = {}
): Lobby {
  const id = `lobby_${++idCounter}`;
  const code = generateCode();
  const mergedConfig: LobbyConfig = { ...DEFAULT_LOBBY_CONFIG, ...config };

  const participant: LobbyParticipant = {
    playerId: hostId,
    displayName: hostName,
    isReady: false,
    isHost: true,
    seatIndex: 0,
  };

  const lobby: Lobby = {
    id,
    code,
    config: mergedConfig,
    participants: new Map([[hostId, participant]]),
    hostId,
    createdAt: Date.now(),
    gameInProgress: false,
  };

  lobbies.set(id, lobby);
  codeToId.set(code, id);
  return lobby;
}

export function getLobby(lobbyId: string): Lobby | undefined {
  return lobbies.get(lobbyId);
}

export function getLobbyByCode(code: string): Lobby | undefined {
  const id = codeToId.get(code.toUpperCase());
  if (!id) return undefined;
  return lobbies.get(id);
}

export function joinLobby(
  lobbyId: string,
  playerId: string,
  displayName: string,
  password?: string
): { success: true; lobby: Lobby } | { success: false; error: string; code: string } {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return { success: false, error: 'Lobby not found', code: 'LOBBY_NOT_FOUND' };
  if (lobby.gameInProgress) return { success: false, error: 'Game already in progress', code: 'GAME_IN_PROGRESS' };
  if (lobby.participants.size >= lobby.config.maxPlayers) {
    return { success: false, error: 'Lobby is full', code: 'LOBBY_FULL' };
  }
  if (lobby.config.isPrivate && lobby.config.password && lobby.config.password !== password) {
    return { success: false, error: 'Wrong password', code: 'LOBBY_WRONG_PASSWORD' };
  }
  if (lobby.participants.has(playerId)) {
    return { success: true, lobby }; // Already in lobby
  }

  // Find next available seat index
  const takenSeats = new Set<number>();
  for (const p of lobby.participants.values()) {
    takenSeats.add(p.seatIndex);
  }
  let seatIndex = 0;
  while (takenSeats.has(seatIndex)) seatIndex++;

  const participant: LobbyParticipant = {
    playerId,
    displayName,
    isReady: false,
    isHost: false,
    seatIndex,
  };

  lobby.participants.set(playerId, participant);
  return { success: true, lobby };
}

export function leaveLobby(lobbyId: string, playerId: string): { deleted: boolean; newHostId?: string } {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return { deleted: false };

  lobby.participants.delete(playerId);

  // If lobby is empty, delete it
  if (lobby.participants.size === 0) {
    lobbies.delete(lobbyId);
    codeToId.delete(lobby.code);
    return { deleted: true };
  }

  // If host left, transfer to next participant
  let newHostId: string | undefined;
  if (lobby.hostId === playerId) {
    const nextHost = lobby.participants.values().next().value;
    if (nextHost) {
      lobby.hostId = nextHost.playerId;
      newHostId = nextHost.playerId;
      // Update participant to be host
      lobby.participants.set(nextHost.playerId, { ...nextHost, isHost: true });
    }
  }

  return { deleted: false, newHostId };
}

export function setReady(lobbyId: string, playerId: string, ready: boolean): boolean {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return false;
  const participant = lobby.participants.get(playerId);
  if (!participant) return false;
  lobby.participants.set(playerId, { ...participant, isReady: ready });
  return true;
}

export function canStartGame(lobby: Lobby): boolean {
  if (lobby.participants.size < 2) return false;
  for (const p of lobby.participants.values()) {
    if (!p.isReady) return false;
  }
  return true;
}

export function listPublicLobbies(): Lobby[] {
  const result: Lobby[] = [];
  for (const lobby of lobbies.values()) {
    if (!lobby.config.isPrivate && !lobby.gameInProgress && lobby.participants.size < lobby.config.maxPlayers) {
      result.push(lobby);
    }
  }
  // Sort by fill percentage (more full = higher priority)
  result.sort((a, b) => {
    const fillA = a.participants.size / a.config.maxPlayers;
    const fillB = b.participants.size / b.config.maxPlayers;
    return fillB - fillA;
  });
  return result;
}

export function toLobbyInfo(lobby: Lobby): LobbyInfo {
  const participants: LobbyParticipant[] = [];
  for (const p of lobby.participants.values()) {
    participants.push(p);
  }
  // Sort by seat index for consistent ordering
  participants.sort((a, b) => a.seatIndex - b.seatIndex);

  // Strip password from config before sending to clients
  const { password: _, ...safeConfig } = lobby.config;

  return {
    id: lobby.id,
    code: lobby.code,
    config: { ...safeConfig, isPrivate: lobby.config.isPrivate },
    participants,
    createdAt: lobby.createdAt,
  };
}

export function swapSeats(lobbyId: string, seatA: number, seatB: number): boolean {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return false;
  if (seatA === seatB) return true;

  // Find participants at these seat indices
  let participantA: LobbyParticipant | undefined;
  let participantB: LobbyParticipant | undefined;
  for (const p of lobby.participants.values()) {
    if (p.seatIndex === seatA) participantA = p;
    if (p.seatIndex === seatB) participantB = p;
  }

  // Swap the seat indices for whichever participants exist at those seats
  if (participantA) {
    lobby.participants.set(participantA.playerId, { ...participantA, seatIndex: seatB });
  }
  if (participantB) {
    lobby.participants.set(participantB.playerId, { ...participantB, seatIndex: seatA });
  }

  return true;
}

export function deleteLobby(lobbyId: string): void {
  const lobby = lobbies.get(lobbyId);
  if (lobby) {
    codeToId.delete(lobby.code);
    lobbies.delete(lobbyId);
  }
}

export function clearAllLobbies(): void {
  lobbies.clear();
  codeToId.clear();
  idCounter = 0;
}
