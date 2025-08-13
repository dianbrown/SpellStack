import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Move, PlayerId } from '@spellstack/engine';
import { C2S, S2C, SeatInfo, RedactedState } from '../types/multiplayer';

interface GameSocketState {
  connected: boolean;
  you?: PlayerId;
  roomCode?: string;
  seats: SeatInfo[];
  redactedState?: RedactedState;
  hostKey?: string;
  error?: { code: string; msg: string };
}

interface UseGameSocketReturn extends GameSocketState {
  createRoom: () => Promise<{ roomCode: string; hostKey: string } | null>;
  joinRoom: (roomCode: string, playerName: string) => Promise<boolean>;
  startGame: (hostKey: string) => void;
  sendMove: (move: Move) => void;
  leaveRoom: () => void;
  clearError: () => void;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8787';

export function useGameSocket(): UseGameSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<GameSocketState>({
    connected: false,
    seats: [],
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  const connect = useCallback(() => {
    // Prevent multiple connections
    if (socketRef.current?.connected) {
      console.log('🔗 Already connected, skipping connection attempt');
      return;
    }
    
    // Disconnect any existing socket first
    if (socketRef.current) {
      console.log('🧹 Cleaning up existing socket');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log('🔌 Attempting to connect to:', WS_URL);
    
    const socket = io(WS_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // Prevent multiple connections from same client
      forceNew: true,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to game server:', socket.id);
      setState(prev => ({ ...prev, connected: true, error: undefined }));
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from game server');
      setState(prev => ({ ...prev, connected: false }));
    });

    socket.on('connect_error', (error: Error) => {
      console.error('💥 Connection error:', error);
      setState(prev => ({ 
        ...prev, 
        connected: false, 
        error: { code: 'connection_error', msg: 'Failed to connect to server' }
      }));
    });

    socketRef.current = socket;
    console.log('🔗 Socket created and stored in ref');

    socket.on('message', (data: S2C) => {
      console.log('Received message:', data);
      
      switch (data.t) {
        case 'room_created':
          setState(prev => ({
            ...prev,
            roomCode: data.room,
            hostKey: data.hostKey,
            error: undefined,
          }));
          break;

        case 'joined':
          setState(prev => ({
            ...prev,
            you: data.you,
            seats: data.seats,
            error: undefined,
          }));
          break;

        case 'seats_updated':
          setState(prev => ({
            ...prev,
            seats: data.seats,
          }));
          break;

        case 'state':
          setState(prev => ({
            ...prev,
            redactedState: data.state,
            error: undefined,
          }));
          break;

        case 'error':
          setState(prev => ({
            ...prev,
            error: { code: data.code, msg: data.msg },
          }));
          break;

        case 'pong':
          // Heartbeat response, do nothing
          break;
      }
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setState({
      connected: false,
      seats: [],
    });
  }, []);

  const sendMessage = useCallback((message: C2S) => {
    console.log('📤 Sending message:', message);
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', message);
      console.log('✅ Message sent successfully');
    } else {
      console.log('❌ Cannot send message - socket not connected');
    }
  }, []);

  const createRoom = useCallback(async (): Promise<{ roomCode: string; hostKey: string } | null> => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) {
        connect();
      }

      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socketRef.current?.off('message', handleMessage);
          resolve(null);
        }
      }, 5000);

      const handleMessage = (data: S2C) => {
        if (!resolved && (data.t === 'room_created' || data.t === 'error')) {
          resolved = true;
          clearTimeout(timeout);
          socketRef.current?.off('message', handleMessage);
          if (data.t === 'room_created') {
            resolve({ roomCode: data.room, hostKey: data.hostKey });
          } else {
            resolve(null);
          }
        }
      };

      // Remove any existing listeners first
      socketRef.current?.off('message', handleMessage);
      socketRef.current?.on('message', handleMessage);
      sendMessage({ t: 'create_room' });
    });
  }, [connect, sendMessage]);

  const joinRoom = useCallback(async (roomCode: string, playerName: string): Promise<boolean> => {
    console.log('🚪 Joining room:', roomCode, 'with name:', playerName);
    
    return new Promise((resolve) => {
      setState(prev => ({ ...prev, roomCode, error: undefined }));

      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('⏰ Join room timeout');
          socketRef.current?.off('message', handleMessage);
          resolve(false);
        }
      }, 10000);

      const handleMessage = (data: S2C) => {
        console.log('📨 Received response for join room:', data);
        if (!resolved && (data.t === 'joined' || data.t === 'error')) {
          resolved = true;
          clearTimeout(timeout);
          socketRef.current?.off('message', handleMessage);
          resolve(data.t === 'joined');
        }
      };

      const attemptJoin = () => {
        if (socketRef.current?.connected) {
          console.log('🔗 Socket connected, sending join message');
          // Remove any existing listeners first
          socketRef.current.off('message', handleMessage);
          socketRef.current.on('message', handleMessage);
          sendMessage({ t: 'join_room', room: roomCode, name: playerName });
        } else {
          console.log('🔌 Socket not connected yet, waiting...');
          // Wait for connection
          let connectionCheckCount = 0;
          const checkConnection = setInterval(() => {
            connectionCheckCount++;
            if (socketRef.current?.connected) {
              clearInterval(checkConnection);
              console.log('✅ Socket connected, now sending join message');
              socketRef.current.off('message', handleMessage);
              socketRef.current.on('message', handleMessage);
              sendMessage({ t: 'join_room', room: roomCode, name: playerName });
            } else if (connectionCheckCount > 50) { // 5 seconds max
              clearInterval(checkConnection);
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                resolve(false);
              }
            }
          }, 100);
        }
      };

      // Ensure connection and then attempt join
      if (!socketRef.current?.connected) {
        console.log('🔌 Socket not connected, calling connect()');
        connect();
      }
      
      attemptJoin();
    });
  }, [connect, sendMessage]);

  const startGame = useCallback((hostKey: string) => {
    sendMessage({ t: 'start_game', hostKey });
  }, [sendMessage]);

  const sendMove = useCallback((move: Move) => {
    sendMessage({ t: 'propose_move', move });
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    sendMessage({ t: 'leave_room' });
    setState(prev => ({
      ...prev,
      you: undefined,
      roomCode: undefined,
      seats: [],
      redactedState: undefined,
      hostKey: undefined,
      error: undefined,
    }));
  }, [sendMessage]);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketRef.current?.connected) {
        sendMessage({ t: 'ping' });
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [sendMessage]);

  return {
    ...state,
    createRoom,
    joinRoom,
    startGame,
    sendMove,
    leaveRoom,
    clearError,
  };
}
