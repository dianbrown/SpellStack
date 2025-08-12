import { GameState, SerializedGameState } from './types.js';

const SERIALIZATION_VERSION = '1.0.0';

/**
 * Serialize game state to JSON
 */
export function serialize(state: GameState): SerializedGameState {
  return {
    state: JSON.parse(JSON.stringify(state)),
    timestamp: Date.now(),
    version: SERIALIZATION_VERSION,
  };
}

/**
 * Deserialize game state from JSON
 */
export function deserialize(serialized: SerializedGameState): GameState {
  if (serialized.version !== SERIALIZATION_VERSION) {
    console.warn(`Version mismatch: expected ${SERIALIZATION_VERSION}, got ${serialized.version}`);
  }
  
  return serialized.state;
}

/**
 * Create a public view of the game state (hiding private information)
 */
export function createPublicState(state: GameState, playerId?: string): any {
  const publicState = {
    ...state,
    drawPile: undefined, // Hide draw pile contents
    drawPileSize: state.drawPile.length,
    playerHands: {} as Record<string, any>,
  };

  // Show hand sizes for all players, but only show actual cards for the requesting player
  for (const player of state.players) {
    if (playerId === player.id) {
      // Show full hand to the player
      publicState.playerHands[player.id] = {
        cards: state.playerHands[player.id] || [],
        size: player.handSize,
      };
    } else {
      // Only show hand size to others
      publicState.playerHands[player.id] = {
        size: player.handSize,
      };
    }
  }

  return publicState;
}
