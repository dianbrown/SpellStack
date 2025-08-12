import { GameState, PlayerId, Move, AIDifficulty, Card, CardType, CardColor } from './types.js';
import { legalMoves } from './engine.js';
import { RNG } from './deck.js';

/**
 * Choose an AI move based on difficulty level
 */
export function chooseAIMove(
  state: GameState, 
  playerId: PlayerId, 
  difficulty: AIDifficulty = AIDifficulty.Medium,
  rng?: RNG
): Move | null {
  const moves = legalMoves(state, playerId);
  if (moves.length === 0) {
    return null;
  }

  const currentRng = rng || new RNG(state.seed + playerId + state.discardPile.length);

  switch (difficulty) {
    case AIDifficulty.Easy:
      return chooseRandomMove(moves, currentRng);
    case AIDifficulty.Medium:
      return chooseMediumMove(state, playerId, moves, currentRng);
    case AIDifficulty.Hard:
      return chooseHardMove(state, playerId, moves, currentRng);
    default:
      return chooseRandomMove(moves, currentRng);
  }
}

/**
 * Easy AI: Random legal move
 */
function chooseRandomMove(moves: Move[], rng: RNG): Move {
  return rng.choice(moves);
}

/**
 * Medium AI: Basic heuristics
 */
function chooseMediumMove(
  state: GameState, 
  playerId: PlayerId, 
  moves: Move[], 
  rng: RNG
): Move {
  const playerHand = state.playerHands[playerId] || [];
  
  // Priority 1: Win the game (play last card)
  if (playerHand.length === 1) {
    const playMoves = moves.filter(m => m.type === 'play_card');
    if (playMoves.length > 0) {
      return rng.choice(playMoves);
    }
  }

  // Priority 2: Play action cards to disrupt opponents
  const actionMoves = moves.filter(m => {
    if (m.type !== 'play_card') return false;
    const card = playerHand.find(c => c.id === m.cardId);
    return card && [
      CardType.Skip, 
      CardType.Reverse, 
      CardType.DrawTwo, 
      CardType.WildDrawFour
    ].includes(card.type);
  });
  
  if (actionMoves.length > 0) {
    return rng.choice(actionMoves);
  }

  // Priority 3: Play cards that match current color (preserve momentum)
  const colorMatches = moves.filter(m => {
    if (m.type !== 'play_card') return false;
    const card = playerHand.find(c => c.id === m.cardId);
    return card && card.color === state.currentColor;
  });

  if (colorMatches.length > 0) {
    return rng.choice(colorMatches);
  }

  // Priority 4: Play wild cards strategically
  const wildMoves = moves.filter(m => {
    if (m.type !== 'play_card') return false;
    const card = playerHand.find(c => c.id === m.cardId);
    return card && (card.type === CardType.Wild || card.type === CardType.WildDrawFour);
  });

  if (wildMoves.length > 0) {
    // Choose color based on hand composition
    const bestColor = getBestColorChoice(playerHand, state.currentColor);
    const wildMove = rng.choice(wildMoves);
    if (wildMove.type === 'play_card') {
      wildMove.chosenColor = bestColor;
    }
    return wildMove;
  }

  // Priority 5: Any other play move
  const playMoves = moves.filter(m => m.type === 'play_card');
  if (playMoves.length > 0) {
    return rng.choice(playMoves);
  }

  // Default: draw or any remaining move
  return rng.choice(moves);
}

/**
 * Hard AI: Advanced heuristics and lookahead
 */
function chooseHardMove(
  state: GameState, 
  playerId: PlayerId, 
  moves: Move[], 
  rng: RNG
): Move {
  // Start with medium AI logic
  const mediumMove = chooseMediumMove(state, playerId, moves, rng);
  
  // TODO: Add Monte Carlo simulation or minimax for true "hard" difficulty
  // For now, use enhanced heuristics
  
  const playerHand = state.playerHands[playerId] || [];
  
  // Enhanced strategy: Consider opponent hand sizes
  const opponents = state.players.filter(p => p.id !== playerId);
  const minOpponentHandSize = Math.min(...opponents.map(p => p.handSize));
  
  // If opponent is close to winning, prioritize disruption
  if (minOpponentHandSize <= 2) {
    const disruptiveMoves = moves.filter(m => {
      if (m.type !== 'play_card') return false;
      const card = playerHand.find(c => c.id === m.cardId);
      return card && [
        CardType.DrawTwo, 
        CardType.WildDrawFour, 
        CardType.Skip,
        CardType.Reverse
      ].includes(card.type);
    });
    
    if (disruptiveMoves.length > 0) {
      return rng.choice(disruptiveMoves);
    }
  }

  return mediumMove;
}

/**
 * Choose the best color for wild cards based on hand composition
 */
function getBestColorChoice(hand: Card[], currentColor: CardColor): CardColor {
  const colorCounts = {
    [CardColor.Red]: 0,
    [CardColor.Green]: 0,
    [CardColor.Blue]: 0,
    [CardColor.Yellow]: 0,
  };

  // Count cards by color (excluding wild cards)
  for (const card of hand) {
    if (card.color !== CardColor.Wild && card.color in colorCounts) {
      colorCounts[card.color as keyof typeof colorCounts]++;
    }
  }

  // Find color with most cards
  const colors = [CardColor.Red, CardColor.Green, CardColor.Blue, CardColor.Yellow];
  let bestColor = currentColor;
  let maxCount = colorCounts[currentColor as keyof typeof colorCounts] || 0;

  for (const color of colors) {
    if (colorCounts[color as keyof typeof colorCounts] > maxCount) {
      maxCount = colorCounts[color as keyof typeof colorCounts];
      bestColor = color;
    }
  }

  return bestColor;
}
