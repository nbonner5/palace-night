import { useCallback, useEffect, useState } from 'react';
import {
  ClientMessage,
  LobbyConfig,
  LobbyInfo,
  ServerMessage,
  ErrorCode,
} from '../../types/multiplayer';

interface UseLobbyOptions {
  send: (msg: ClientMessage) => void;
  onMessage: (type: string, listener: (msg: ServerMessage) => void) => () => void;
}

export function useLobby({ send, onMessage }: UseLobbyOptions) {
  const [lobby, setLobby] = useState<LobbyInfo | null>(null);
  const [lobbyList, setLobbyList] = useState<readonly LobbyInfo[]>([]);
  const [error, setError] = useState<{ code: ErrorCode; message: string } | null>(null);

  useEffect(() => {
    const unsubs = [
      onMessage('LOBBY_CREATED', (msg) => {
        if (msg.type === 'LOBBY_CREATED') {
          setLobby(msg.lobby);
          setError(null);
        }
      }),
      onMessage('LOBBY_JOINED', (msg) => {
        if (msg.type === 'LOBBY_JOINED') {
          setLobby(msg.lobby);
          setError(null);
        }
      }),
      onMessage('LOBBY_UPDATED', (msg) => {
        if (msg.type === 'LOBBY_UPDATED') {
          setLobby(msg.lobby);
        }
      }),
      onMessage('LOBBY_LIST', (msg) => {
        if (msg.type === 'LOBBY_LIST') {
          setLobbyList(msg.lobbies);
        }
      }),
      onMessage('ERROR', (msg) => {
        if (msg.type === 'ERROR') {
          setError({ code: msg.code, message: msg.message });
        }
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [onMessage]);

  const createLobby = useCallback((config: LobbyConfig) => {
    setError(null);
    send({ type: 'CREATE_LOBBY', config });
  }, [send]);

  const joinLobby = useCallback((code: string, password?: string) => {
    setError(null);
    send({ type: 'JOIN_LOBBY', code, password });
  }, [send]);

  const leaveLobby = useCallback(() => {
    send({ type: 'LEAVE_LOBBY' });
    setLobby(null);
  }, [send]);

  const setReady = useCallback((ready: boolean) => {
    send({ type: 'SET_READY', ready });
  }, [send]);

  const refreshList = useCallback(() => {
    send({ type: 'LIST_LOBBIES' });
  }, [send]);

  return {
    lobby,
    lobbyList,
    error,
    createLobby,
    joinLobby,
    leaveLobby,
    setReady,
    refreshList,
  };
}
