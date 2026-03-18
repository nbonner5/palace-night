import { useCallback, useEffect, useRef, useState } from 'react';
import { io as ioClient, Socket } from 'socket.io-client';
import { ClientMessage, ServerMessage } from '../../types/multiplayer';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

const DEFAULT_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://palace-night.fly.dev';

export function useSocket(serverUrl?: string) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<(msg: ServerMessage) => void>>>(new Map());

  const url = serverUrl ?? DEFAULT_URL;

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setStatus('connecting');
    const socket = ioClient(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setStatus('connected');
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    socket.on('message', (msg: ServerMessage) => {
      if (msg.type === 'WELCOME') {
        setPlayerId(msg.playerId);
      }

      // Dispatch to type-specific listeners
      const typeListeners = listenersRef.current.get(msg.type);
      if (typeListeners) {
        for (const listener of typeListeners) {
          listener(msg);
        }
      }

      // Dispatch to wildcard listeners
      const allListeners = listenersRef.current.get('*');
      if (allListeners) {
        for (const listener of allListeners) {
          listener(msg);
        }
      }
    });

    socketRef.current = socket;
  }, [url]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setStatus('disconnected');
    setPlayerId(null);
  }, []);

  const send = useCallback((msg: ClientMessage) => {
    socketRef.current?.emit('message', msg);
  }, []);

  const onMessage = useCallback((type: string, listener: (msg: ServerMessage) => void) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type)!.add(listener);

    // Return unsubscribe function
    return () => {
      listenersRef.current.get(type)?.delete(listener);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      listenersRef.current.clear();
    };
  }, []);

  return {
    status,
    playerId,
    connect,
    disconnect,
    send,
    onMessage,
  };
}
