import { Socket } from 'socket.io';
import { GameState, PlayerId } from '@spellstack/engine';
import { SeatInfo } from './types';

export interface Room {
  id: string;
  sockets: Set<string>; // socket.id set
  players: Map<PlayerId, { socketId: string; name: string; connected: boolean }>; // playerId -> socket info
  state: GameState | null;
  createdAt: Date;
  lastSeen: Date;
  hostKey: string;
  hostPlayerId?: PlayerId; // Track who created the room
}

export function createRoom(roomId: string, hostKey: string): Room {
  return {
    id: roomId,
    sockets: new Set(),
    players: new Map(),
    state: null,
    createdAt: new Date(),
    lastSeen: new Date(),
    hostKey,
  };
}

export function addPlayerToRoom(room: Room, socket: Socket, playerName: string): PlayerId {
  // Check if a player with this name already exists and is disconnected
  let existingPlayerId: PlayerId | null = null;
  for (const [playerId, playerInfo] of room.players.entries()) {
    if (playerInfo.name === playerName && !playerInfo.connected) {
      existingPlayerId = playerId;
      break;
    }
  }
  
  let playerId: PlayerId;
  if (existingPlayerId) {
    // Reconnect existing player
    playerId = existingPlayerId;
    const playerInfo = room.players.get(playerId)!;
    playerInfo.socketId = socket.id;
    playerInfo.connected = true;
    console.log(`🔄 Player ${playerName} reconnected as ${playerId}`);
  } else {
    // Create new player
    playerId = `player_${room.players.size + 1}` as PlayerId;
    room.players.set(playerId, {
      socketId: socket.id,
      name: playerName,
      connected: true,
    });
    console.log(`➕ New player ${playerName} added as ${playerId}`);
  }
  
  room.sockets.add(socket.id);
  
  // First player becomes host
  if (!room.hostPlayerId) {
    room.hostPlayerId = playerId;
  }
  
  room.lastSeen = new Date();
  return playerId;
}

export function removePlayerFromRoom(room: Room, socketId: string): PlayerId | null {
  room.sockets.delete(socketId);
  
  // Find player by socket ID
  for (const [playerId, playerInfo] of room.players.entries()) {
    if (playerInfo.socketId === socketId) {
      playerInfo.connected = false;
      room.lastSeen = new Date();
      return playerId;
    }
  }
  
  return null;
}

export function reconnectPlayer(room: Room, socket: Socket, playerId: PlayerId): boolean {
  const playerInfo = room.players.get(playerId);
  if (!playerInfo) return false;
  
  // Update socket info for reconnection
  room.sockets.add(socket.id);
  playerInfo.socketId = socket.id;
  playerInfo.connected = true;
  room.lastSeen = new Date();
  
  return true;
}

export function getRoomSeats(room: Room): SeatInfo[] {
  return Array.from(room.players.entries()).map(([playerId, info]) => ({
    playerId,
    playerName: info.name,
    connected: info.connected,
  }));
}

export function isRoomEmpty(room: Room): boolean {
  return room.sockets.size === 0;
}

export function isRoomExpired(room: Room, idleMinutes: number): boolean {
  const now = new Date();
  const idleMs = idleMinutes * 60 * 1000;
  return isRoomEmpty(room) && (now.getTime() - room.lastSeen.getTime()) > idleMs;
}
