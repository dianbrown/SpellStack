import { z } from 'zod';

// Enums
export enum CardColor {
  Red = 'red',
  Green = 'green',
  Blue = 'blue', 
  Yellow = 'yellow',
  Wild = 'wild'
}

export enum CardType {
  Number = 'number',
  Skip = 'skip',
  Reverse = 'reverse',
  DrawTwo = 'draw_two',
  Wild = 'wild',
  WildDrawFour = 'wild_draw_four'
}

export enum Direction {
  Clockwise = 'clockwise',
  CounterClockwise = 'counter_clockwise'
}

export enum GamePhase {
  Lobby = 'lobby',
  Dealing = 'dealing',
  Playing = 'playing',
  RoundEnd = 'round_end',
  GameEnd = 'game_end'
}

// Zod schemas for validation
export const CardSchema = z.object({
  id: z.string(),
  color: z.nativeEnum(CardColor),
  type: z.nativeEnum(CardType),
  value: z.number().min(0).max(9).optional(), // Only for number cards
});

export const PlayerIdSchema = z.string();

export const MoveSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('play_card'),
    cardId: z.string(),
    chosenColor: z.nativeEnum(CardColor).optional(), // For wild cards
  }),
  z.object({
    type: z.literal('draw_card'),
  }),
  z.object({
    type: z.literal('pass_turn'),
  }),
  z.object({
    type: z.literal('call_uno'),
  }),
  z.object({
    type: z.literal('challenge_uno'),
    targetPlayerId: z.string(),
  })
]);

export const PlayerSchema = z.object({
  id: PlayerIdSchema,
  name: z.string(),
  isBot: z.boolean().default(false),
  handSize: z.number().min(0), // Public info
  calledSpell: z.boolean().default(false),
});

export const GameStateSchema = z.object({
  id: z.string(),
  phase: z.nativeEnum(GamePhase),
  players: z.array(PlayerSchema),
  currentPlayerId: z.string(),
  direction: z.nativeEnum(Direction),
  topCard: CardSchema,
  currentColor: z.nativeEnum(CardColor),
  drawPile: z.array(CardSchema),
  discardPile: z.array(CardSchema),
  playerHands: z.record(z.string(), z.array(CardSchema)), // Private info
  drawCount: z.number().default(0), // For stacking +2/+4 cards
  canPlayDrawnCard: z.boolean().default(false),
  lastDrawnCard: CardSchema.optional(),
  seed: z.string(),
  settings: z.object({
    spellCallRequired: z.boolean().default(false),
    stackDrawCards: z.boolean().default(true),
    maxPlayers: z.number().min(2).max(4).default(4),
  }),
});

// Type exports
export type Card = z.infer<typeof CardSchema>;
export type PlayerId = z.infer<typeof PlayerIdSchema>;
export type Move = z.infer<typeof MoveSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type GameState = z.infer<typeof GameStateSchema>;

// Additional types
export interface CreateGameOptions {
  players: Array<{ id: string; name: string; isBot?: boolean }>;
  seed: string;
  settings?: Partial<GameState['settings']>;
}

export interface GameResult {
  winner: PlayerId | null;
  scores: Record<PlayerId, number>;
  isTerminal: boolean;
}

export interface SerializedGameState {
  state: GameState;
  timestamp: number;
  version: string;
}

// AI difficulty levels
export enum AIDifficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard'
}

// Events for multiplayer
export interface GameEvent {
  type: string;
  playerId: PlayerId;
  data: any;
  timestamp: number;
}

// Public game state (without private hands)
export interface PublicGameState extends Omit<GameState, 'playerHands' | 'drawPile'> {
  drawPileSize: number;
  playerHands: Record<PlayerId, { size: number }>;
}

// Redacted state that clients receive (no secret info)
export interface RedactedGameState extends Omit<GameState, 'playerHands'> {
  playerHands: Record<PlayerId, { count: number }>;
  yourHand?: GameState['playerHands'][PlayerId]; // Only present for the viewing player
}
