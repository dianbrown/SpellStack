import { GameState, PlayerId, Move, RedactedGameState } from '@spellstack/engine';

// Seat info for lobby display
export interface SeatInfo {
  playerId: PlayerId;
  playerName: string;
  connected: boolean;
}

// Re-export the engine's RedactedGameState for convenience
export type RedactedState = RedactedGameState;

// Client -> Server messages
export type C2S =
  | { t: 'create_room' }
  | { t: 'join_room'; room: string; name: string }
  | { t: 'start_game'; hostKey: string }
  | { t: 'propose_move'; move: Move }
  | { t: 'leave_room' }
  | { t: 'ping' };

// Server -> Client messages  
export type S2C =
  | { t: 'room_created'; room: string; hostKey: string }
  | { t: 'joined'; you: PlayerId; seats: SeatInfo[] }
  | { t: 'state'; state: RedactedState }
  | { t: 'seats_updated'; seats: SeatInfo[] }
  | { t: 'error'; code: string; msg: string }
  | { t: 'pong' };

// Error codes
export const ErrorCodes = {
  ROOM_NOT_FOUND: 'room_not_found',
  ROOM_FULL: 'room_full',
  INVALID_HOST_KEY: 'invalid_host_key',
  GAME_ALREADY_STARTED: 'game_already_started',
  NOT_YOUR_TURN: 'not_your_turn',
  ILLEGAL_MOVE: 'illegal_move',
  INVALID_NAME: 'invalid_name',
} as const;
