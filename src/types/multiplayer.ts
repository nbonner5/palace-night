import {
  Action,
  Card,
  GamePhase,
  JumpInWindow,
  PlayerPhase,
  Rank,
  GameEvent,
} from './index';

// ── Lobby Types ──

export interface LobbyConfig {
  readonly maxPlayers: number; // 2-7
  readonly deckCount: number;
  readonly includeJokers: boolean;
  readonly isPrivate: boolean;
  readonly password?: string;
}

export const DEFAULT_LOBBY_CONFIG: LobbyConfig = {
  maxPlayers: 4,
  deckCount: 1,
  includeJokers: true,
  isPrivate: false,
};

export interface LobbyParticipant {
  readonly playerId: string;
  readonly displayName: string;
  readonly isReady: boolean;
  readonly isHost: boolean;
  readonly seatIndex: number;
}

export interface LobbyInfo {
  readonly id: string;
  readonly code: string;
  readonly config: LobbyConfig;
  readonly participants: readonly LobbyParticipant[];
  readonly createdAt: number;
}

// ── Filtered Game State (per-player view) ──

export interface FilteredPlayerState {
  readonly id: number;
  readonly handCount: number;
  readonly hand: readonly Card[]; // full for self, empty for others
  readonly faceUp: readonly Card[]; // visible to all
  readonly faceDownCount: number; // count only (nobody sees values)
  readonly faceDown: readonly Card[]; // empty during game, populated at game end
  readonly phase: PlayerPhase;
}

export interface FilteredGameState {
  readonly gamePhase: GamePhase;
  readonly pile: readonly Card[];
  readonly drawPileCount: number;
  readonly burnPileCount: number;
  readonly players: readonly FilteredPlayerState[];
  readonly currentPlayerIndex: number;
  readonly mustPlayAgain: boolean;
  readonly jumpInWindow: JumpInWindow | null;
  readonly winnerId: number | null;
  readonly turnNumber: number;
  readonly setupChoicesRemaining: number;
  readonly yourSeatIndex: number;
  readonly seatNames: readonly string[];
  readonly seatConnected: readonly boolean[];
  readonly stateVersion: number;
  readonly actionLog: readonly string[];
}

// ── Client-to-Server Messages ──

export interface C2S_SetDisplayName {
  readonly type: 'SET_DISPLAY_NAME';
  readonly displayName: string;
}

export interface C2S_CreateLobby {
  readonly type: 'CREATE_LOBBY';
  readonly config: LobbyConfig;
}

export interface C2S_JoinLobby {
  readonly type: 'JOIN_LOBBY';
  readonly code: string;
  readonly password?: string;
}

export interface C2S_LeaveLobby {
  readonly type: 'LEAVE_LOBBY';
}

export interface C2S_SetReady {
  readonly type: 'SET_READY';
  readonly ready: boolean;
}

export interface C2S_ListLobbies {
  readonly type: 'LIST_LOBBIES';
}

export interface C2S_Ping {
  readonly type: 'PING';
  readonly timestamp: number;
}

export interface C2S_GameAction {
  readonly type: 'GAME_ACTION';
  readonly action: Action;
  readonly stateVersion: number;
}

export interface C2S_Reconnect {
  readonly type: 'RECONNECT';
  readonly playerId: string;
  readonly lobbyId: string;
}

export interface C2S_SetRematchReady {
  readonly type: 'SET_REMATCH_READY';
  readonly ready: boolean;
}

export interface C2S_SwapSeats {
  readonly type: 'SWAP_SEATS';
  readonly seatA: number;
  readonly seatB: number;
}

export type ClientMessage =
  | C2S_SetDisplayName
  | C2S_CreateLobby
  | C2S_JoinLobby
  | C2S_LeaveLobby
  | C2S_SetReady
  | C2S_ListLobbies
  | C2S_Ping
  | C2S_GameAction
  | C2S_Reconnect
  | C2S_SetRematchReady
  | C2S_SwapSeats;

// ── Server-to-Client Messages ──

export interface S2C_Welcome {
  readonly type: 'WELCOME';
  readonly playerId: string;
}

export interface S2C_Pong {
  readonly type: 'PONG';
  readonly timestamp: number;
  readonly serverTime: number;
}

export interface S2C_Error {
  readonly type: 'ERROR';
  readonly code: ErrorCode;
  readonly message: string;
}

export interface S2C_LobbyCreated {
  readonly type: 'LOBBY_CREATED';
  readonly lobby: LobbyInfo;
}

export interface S2C_LobbyJoined {
  readonly type: 'LOBBY_JOINED';
  readonly lobby: LobbyInfo;
}

export interface S2C_LobbyUpdated {
  readonly type: 'LOBBY_UPDATED';
  readonly lobby: LobbyInfo;
}

export interface S2C_LobbyList {
  readonly type: 'LOBBY_LIST';
  readonly lobbies: readonly LobbyInfo[];
}

export interface S2C_HostChanged {
  readonly type: 'HOST_CHANGED';
  readonly newHostId: string;
  readonly newHostName: string;
}

export interface S2C_GameStarted {
  readonly type: 'GAME_STARTED';
  readonly state: FilteredGameState;
}

export interface S2C_GameStateUpdate {
  readonly type: 'GAME_STATE_UPDATE';
  readonly state: FilteredGameState;
  readonly events: readonly GameEvent[];
}

export interface S2C_TurnTimer {
  readonly type: 'TURN_TIMER';
  readonly remainingMs: number;
  readonly totalMs: number;
}

export interface S2C_JumpInWindowOpen {
  readonly type: 'JUMP_IN_WINDOW_OPEN';
  readonly cardRank: Rank;
  readonly durationMs: number;
}

export interface S2C_JumpInWindowClosed {
  readonly type: 'JUMP_IN_WINDOW_CLOSED';
}

export interface S2C_PlayerDisconnected {
  readonly type: 'PLAYER_DISCONNECTED';
  readonly playerId: string;
  readonly displayName: string;
  readonly seatIndex: number;
}

export interface S2C_PlayerReconnected {
  readonly type: 'PLAYER_RECONNECTED';
  readonly playerId: string;
  readonly displayName: string;
  readonly seatIndex: number;
}

export interface S2C_GameOver {
  readonly type: 'GAME_OVER';
  readonly winnerId: number;
  readonly winnerName: string;
  readonly finalState: FilteredGameState;
  readonly leaderboard: Record<number, number>;
}

export interface RematchPlayerInfo {
  readonly seatIndex: number;
  readonly displayName: string;
  readonly isReady: boolean;
}

export interface S2C_RematchUpdate {
  readonly type: 'REMATCH_UPDATE';
  readonly players: RematchPlayerInfo[];
  readonly lobbyCode: string;
  readonly yourSeatIndex: number;
}

export interface S2C_RematchStarted {
  readonly type: 'REMATCH_STARTED';
  readonly state: FilteredGameState;
}

export type ServerMessage =
  | S2C_Welcome
  | S2C_Pong
  | S2C_Error
  | S2C_LobbyCreated
  | S2C_LobbyJoined
  | S2C_LobbyUpdated
  | S2C_LobbyList
  | S2C_HostChanged
  | S2C_GameStarted
  | S2C_GameStateUpdate
  | S2C_TurnTimer
  | S2C_JumpInWindowOpen
  | S2C_JumpInWindowClosed
  | S2C_PlayerDisconnected
  | S2C_PlayerReconnected
  | S2C_GameOver
  | S2C_RematchUpdate
  | S2C_RematchStarted;

// ── Error Codes ──

export type ErrorCode =
  | 'LOBBY_NOT_FOUND'
  | 'LOBBY_FULL'
  | 'LOBBY_WRONG_PASSWORD'
  | 'GAME_IN_PROGRESS'
  | 'NOT_IN_LOBBY'
  | 'NOT_YOUR_TURN'
  | 'INVALID_ACTION'
  | 'STALE_STATE'
  | 'NAME_REQUIRED'
  | 'RECONNECT_FAILED';
