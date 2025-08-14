import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';

import { createGame, legalMoves, applyMove, applyAutomaticDrawCards, isTerminal, GameState, PlayerId, redactedView } from '@spellstack/engine';
import { C2S, S2C, RedactedState, ErrorCodes } from './types';
import { 
  Room, 
  createRoom, 
  addPlayerToRoom, 
  removePlayerFromRoom,
  getRoomSeats,
  isRoomExpired 
} from './room';

dotenv.config();

const PORT = process.env.PORT || 8787;
const CORS_ORIGIN = process.env.CORS_ORIGIN || [
  'http://localhost:3000', 
  'http://localhost:3001', 
  'http://localhost:3002',
  'http://192.168.0.24:3000',
  'http://192.168.0.24:3001', 
  'http://192.168.0.24:3002'
];
const ROOM_IDLE_MINUTES = parseInt(process.env.ROOM_IDLE_MINUTES || '10');

const app = express();
const server = createServer(app);

// CORS configuration
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

const io = new SocketIOServer(server, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true
  }
});

// In-memory room storage
const rooms = new Map<string, Room>();

// Helper function to create redacted view for a player
function createRedactedView(state: GameState, viewerId: PlayerId | null): RedactedState {
  return redactedView(state, viewerId);
}

// Periodic cleanup of expired rooms
setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    if (isRoomExpired(room, ROOM_IDLE_MINUTES)) {
      console.log(`Cleaning up expired room: ${roomId}`);
      rooms.delete(roomId);
    }
  }
}, 60000); // Check every minute

io.on('connection', (socket) => {
  console.log(`🔗 Client connected: ${socket.id} from ${socket.handshake.address}`);

  let currentRoomId: string | null = null;
  let currentPlayerId: PlayerId | null = null;

  socket.on('message', (data: C2S) => {
    console.log(`📨 Received message from ${socket.id}:`, data);
    try {
      switch (data.t) {
        case 'create_room': {
          const roomId = nanoid(5).toUpperCase();
          const hostKey = nanoid(16);
          const room = createRoom(roomId, hostKey);
          
          rooms.set(roomId, room);
          
          const response: S2C = { t: 'room_created', room: roomId, hostKey };
          socket.emit('message', response);
          break;
        }

        case 'join_room': {
          const { room: roomId, name } = data;
          
          if (!name || name.trim().length === 0) {
            const error: S2C = { 
              t: 'error', 
              code: ErrorCodes.INVALID_NAME, 
              msg: 'Name is required' 
            };
            socket.emit('message', error);
            return;
          }

          const room = rooms.get(roomId);
          if (!room) {
            const error: S2C = { 
              t: 'error', 
              code: ErrorCodes.ROOM_NOT_FOUND, 
              msg: 'Room not found' 
            };
            socket.emit('message', error);
            return;
          }

          if (room.players.size >= 4) {
            const error: S2C = { 
              t: 'error', 
              code: ErrorCodes.ROOM_FULL, 
              msg: 'Room is full' 
            };
            socket.emit('message', error);
            return;
          }

          currentRoomId = roomId;
          currentPlayerId = addPlayerToRoom(room, socket, name.trim());
          
          socket.join(roomId);

          const seats = getRoomSeats(room);
          const joined: S2C = { t: 'joined', you: currentPlayerId, seats };
          socket.emit('message', joined);

          // Notify all players in room about updated seats
          const seatsUpdate: S2C = { t: 'seats_updated', seats };
          io.to(roomId).emit('message', seatsUpdate);

          // If game is in progress, send current state
          if (room.state) {
            const stateMsg: S2C = { 
              t: 'state', 
              state: createRedactedView(room.state, currentPlayerId) 
            };
            socket.emit('message', stateMsg);
          }
          break;
        }

        case 'start_game': {
          const { hostKey } = data;
          
          if (!currentRoomId) {
            const error: S2C = { 
              t: 'error', 
              code: ErrorCodes.ROOM_NOT_FOUND, 
              msg: 'Not in a room' 
            };
            socket.emit('message', error);
            return;
          }

          const room = rooms.get(currentRoomId);
          if (!room || room.hostKey !== hostKey) {
            const error: S2C = { 
              t: 'error', 
              code: ErrorCodes.INVALID_HOST_KEY, 
              msg: 'Invalid host key' 
            };
            socket.emit('message', error);
            return;
          }

          if (room.state) {
            const error: S2C = { 
              t: 'error', 
              code: ErrorCodes.GAME_ALREADY_STARTED, 
              msg: 'Game already started' 
            };
            socket.emit('message', error);
            return;
          }

          if (room.players.size < 2) {
            const error: S2C = { 
              t: 'error', 
              code: 'insufficient_players', 
              msg: 'Need at least 2 players to start' 
            };
            socket.emit('message', error);
            return;
          }

          // Create game with connected players
          const playerIds = Array.from(room.players.keys());
          const players = playerIds.map(id => ({
            id,
            name: room.players.get(id)!.name,
            isBot: false
          }));

          room.state = createGame({
            seed: Date.now().toString(),
            players
          });

          // Send personalized state to each player
          for (const [playerId, playerInfo] of room.players.entries()) {
            if (playerInfo.connected) {
              const stateMsg: S2C = { 
                t: 'state', 
                state: createRedactedView(room.state, playerId) 
              };
              io.to(playerInfo.socketId).emit('message', stateMsg);
            }
          }
          break;
        }

        case 'propose_move': {
          const { move } = data;
          
          console.log(`🎮 Move proposed by ${currentPlayerId}:`, move);
          
          if (!currentRoomId || !currentPlayerId) {
            const error: S2C = { 
              t: 'error', 
              code: ErrorCodes.ROOM_NOT_FOUND, 
              msg: 'Not in a room' 
            };
            socket.emit('message', error);
            return;
          }

          const room = rooms.get(currentRoomId);
          if (!room || !room.state) {
            const error: S2C = { 
              t: 'error', 
              code: ErrorCodes.ROOM_NOT_FOUND, 
              msg: 'Game not started' 
            };
            socket.emit('message', error);
            return;
          }

          console.log(`🎯 Current turn: ${room.state.currentPlayerId}, Move by: ${currentPlayerId}`);

          // Verify it's player's turn
          if (room.state.currentPlayerId !== currentPlayerId) {
            console.log(`❌ Turn mismatch! Expected: ${room.state.currentPlayerId}, Got: ${currentPlayerId}`);
            const error: S2C = { 
              t: 'error', 
              code: ErrorCodes.NOT_YOUR_TURN, 
              msg: `Not your turn (current: ${room.state.currentPlayerId})` 
            };
            socket.emit('message', error);
            return;
          }

          // Verify move is legal
          const legal = legalMoves(room.state, currentPlayerId);
          console.log(`🎲 Legal moves for ${currentPlayerId}:`, legal.length, 'moves');
          
          const isLegal = legal.some(legalMove => 
            JSON.stringify(legalMove) === JSON.stringify(move)
          );

          if (!isLegal) {
            console.log(`🚫 Illegal move by ${currentPlayerId}:`, move);
            console.log(`🎲 Legal moves were:`, legal);
            const error: S2C = { 
              t: 'error', 
              code: ErrorCodes.ILLEGAL_MOVE, 
              msg: 'Illegal move' 
            };
            socket.emit('message', error);
            return;
          }

          console.log(`✅ Legal move by ${currentPlayerId}, applying...`);

          // Apply move
          room.state = applyMove(room.state, move);
          room.lastSeen = new Date();
          
          // Apply automatic draw cards if needed (handles +2/+4 stacking)
          if (room.state.drawCount > 0) {
            console.log(`🎴 Auto-applying draw cards, count: ${room.state.drawCount}, current player: ${room.state.currentPlayerId}`);
            const stateAfterAutoDraw = applyAutomaticDrawCards(room.state);
            if (stateAfterAutoDraw !== room.state) {
              room.state = stateAfterAutoDraw;
              console.log(`🎴 After auto-draw, count: ${room.state.drawCount}, current player: ${room.state.currentPlayerId}`);
            }
          }
          
          console.log(`🔄 After move processing, current turn: ${room.state.currentPlayerId}`);
          
          // Check if game is terminal (someone won)
          if (isTerminal(room.state)) {
            console.log(`🏆 Game ended! Phase: ${room.state.phase}`);
            // Send final state to all players first
            for (const [playerId, playerInfo] of room.players.entries()) {
              if (playerInfo.connected) {
                const stateMsg: S2C = { 
                  t: 'state', 
                  state: createRedactedView(room.state, playerId) 
                };
                io.to(playerInfo.socketId).emit('message', stateMsg);
              }
            }
            
            // Reset room state after a delay so players can see the final state
            setTimeout(() => {
              if (room) {
                console.log(`🔄 Resetting room ${currentRoomId} to lobby after game end`);
                room.state = null; // Reset to lobby
              }
            }, 3000); // 3 second delay
          } else {
            // Send updated state to all players (normal turn)
            for (const [playerId, playerInfo] of room.players.entries()) {
              if (playerInfo.connected) {
                const stateMsg: S2C = { 
                  t: 'state', 
                  state: createRedactedView(room.state, playerId) 
                };
                io.to(playerInfo.socketId).emit('message', stateMsg);
              }
            }
          }
          break;
        }

        case 'leave_room': {
          if (currentRoomId) {
            const room = rooms.get(currentRoomId);
            if (room) {
              removePlayerFromRoom(room, socket.id);
              socket.leave(currentRoomId);
              
              // Notify remaining players
              const seats = getRoomSeats(room);
              const seatsUpdate: S2C = { t: 'seats_updated', seats };
              io.to(currentRoomId).emit('message', seatsUpdate);
            }
          }
          
          currentRoomId = null;
          currentPlayerId = null;
          break;
        }

        case 'ping': {
          const pong: S2C = { t: 'pong' };
          socket.emit('message', pong);
          break;
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
      const errorMsg: S2C = { 
        t: 'error', 
        code: 'internal_error', 
        msg: 'Internal server error' 
      };
      socket.emit('message', errorMsg);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        removePlayerFromRoom(room, socket.id);
        
        // Notify remaining players
        const seats = getRoomSeats(room);
        const seatsUpdate: S2C = { t: 'seats_updated', seats };
        io.to(currentRoomId).emit('message', seatsUpdate);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    
    // Clean up room and notify others
    if (currentRoomId && currentPlayerId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        removePlayerFromRoom(room, currentPlayerId);
        
        // If room is empty, delete it
        if (Object.keys(room.players).length === 0) {
          rooms.delete(currentRoomId);
        } else {
          // Notify remaining players
          const seats = getRoomSeats(room);
          const seatsUpdate: S2C = { t: 'seats_updated', seats };
          io.to(currentRoomId).emit('message', seatsUpdate);
        }
      }
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`SpellStack server running on port ${PORT} (all interfaces)`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
  console.log(`Room idle timeout: ${ROOM_IDLE_MINUTES} minutes`);
});
