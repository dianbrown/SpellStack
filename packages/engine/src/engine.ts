import { 
  GameState, 
  Card, 
  Move, 
  PlayerId, 
  CardColor, 
  CardType, 
  Direction, 
  GamePhase,
  CreateGameOptions,
  GameResult
} from './types.js';
import { RNG, createDeck, dealCards, calculateHandScore } from './deck.js';

/**
 * Create a new game with initial state
 */
export function createGame(options: CreateGameOptions): GameState {
  const { players, seed, settings = {} } = options;
  
  if (players.length < 2 || players.length > 4) {
    throw new Error('Game requires 2-4 players');
  }

  const rng = new RNG(seed);
  const deck = rng.shuffle(createDeck());
  
  const { hands, remainingDeck } = dealCards(deck, players.map(p => p.id));
  
  // Find a valid starting card (not a wild or wild draw four)
  let topCard: Card;
  let startDeck = [...remainingDeck];
  
  do {
    if (startDeck.length === 0) {
      throw new Error('No valid starting card found');
    }
    topCard = startDeck.pop()!;
  } while (topCard.type === CardType.Wild || topCard.type === CardType.WildDrawFour);

  return {
    id: `game-${Date.now()}`,
    phase: GamePhase.Playing,
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      isBot: p.isBot || false,
      handSize: hands[p.id].length,
      calledSpell: false,
    })),
    currentPlayerId: players[0].id,
    direction: Direction.Clockwise,
    topCard,
    currentColor: topCard.color === CardColor.Wild ? CardColor.Red : topCard.color,
    drawPile: startDeck,
    discardPile: [topCard],
    playerHands: hands,
    drawCount: 0,
    canPlayDrawnCard: false,
    seed,
    settings: {
      spellCallRequired: false,
      stackDrawCards: true,
      maxPlayers: 4,
      ...settings,
    },
  };
}

/**
 * Apply automatic draw cards if player is affected by +2/+4 cards
 * Returns the updated game state with cards drawn automatically
 */
export function applyAutomaticDrawCards(state: GameState, rng?: RNG): GameState {
  if (state.drawCount === 0) {
    return state; // No cards to draw
  }

  const playerId = state.currentPlayerId;
  const playerHand = state.playerHands[playerId] || [];
  
  // Check if player has stackable cards (+2 or +4) when stacking is enabled
  if (state.settings.stackDrawCards) {
    const hasStackableCards = playerHand.some(card => 
      (card.type === CardType.DrawTwo && 
       (state.topCard.type === CardType.DrawTwo || state.topCard.type === CardType.WildDrawFour)) ||
      card.type === CardType.WildDrawFour
    );
    
    // If player has stackable cards, don't auto-draw (let them choose)
    if (hasStackableCards) {
      return state;
    }
  }
  
  // Auto-draw the required cards
  const currentRng = rng || new RNG(state.seed + state.discardPile.length);
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  return applyDrawCard(newState, currentRng);
}

/**
 * Get all legal moves for a player
 */
export function legalMoves(state: GameState, playerId: PlayerId): Move[] {
  if (state.phase !== GamePhase.Playing || state.currentPlayerId !== playerId) {
    return [];
  }

  const moves: Move[] = [];
  const playerHand = state.playerHands[playerId] || [];
  
  // If player must draw cards due to +2/+4, automatically draw them first
  // Only return stacking moves if they have stackable cards
  if (state.drawCount > 0) {
    // Can play another +2 or +4 if stacking is enabled
    if (state.settings.stackDrawCards) {
      const stackableCards = playerHand.filter(card => 
        card.type === CardType.DrawTwo || card.type === CardType.WildDrawFour
      );
      
      for (const card of stackableCards) {
        if (card.type === CardType.DrawTwo && 
            (state.topCard.type === CardType.DrawTwo || 
             state.topCard.type === CardType.WildDrawFour)) {
          moves.push({ type: 'play_card', cardId: card.id });
        } else if (card.type === CardType.WildDrawFour) {
          // Wild +4 can stack on any draw card
          for (const color of [CardColor.Red, CardColor.Green, CardColor.Blue, CardColor.Yellow]) {
            moves.push({ type: 'play_card', cardId: card.id, chosenColor: color });
          }
        }
      }
    }
    
    // If no stacking cards available, force automatic draw
    if (moves.length === 0) {
      moves.push({ type: 'draw_card' });
    }
    return moves;
  }

  // If player just drew a card, they can either play it (if legal) or pass turn
  if (state.canPlayDrawnCard && state.lastDrawnCard) {
    if (isCardPlayable(state.lastDrawnCard, state.topCard, state.currentColor)) {
      if (state.lastDrawnCard.type === CardType.Wild || 
          state.lastDrawnCard.type === CardType.WildDrawFour) {
        for (const color of [CardColor.Red, CardColor.Green, CardColor.Blue, CardColor.Yellow]) {
          moves.push({ 
            type: 'play_card', 
            cardId: state.lastDrawnCard.id, 
            chosenColor: color 
          });
        }
      } else {
        moves.push({ type: 'play_card', cardId: state.lastDrawnCard.id });
      }
    }
    // Always allow passing turn after drawing a card
    moves.push({ type: 'pass_turn' });
    return moves;
  }

  // Normal turn: can play any legal card or draw
  for (const card of playerHand) {
    if (isCardPlayable(card, state.topCard, state.currentColor)) {
      if (card.type === CardType.Wild || card.type === CardType.WildDrawFour) {
        // Wild cards require color choice
        for (const color of [CardColor.Red, CardColor.Green, CardColor.Blue, CardColor.Yellow]) {
          // Wild +4 can only be played if player has no matching color
          if (card.type === CardType.WildDrawFour) {
            const hasMatchingColor = playerHand.some(c => 
              c.id !== card.id && c.color === state.currentColor
            );
            if (!hasMatchingColor) {
              moves.push({ type: 'play_card', cardId: card.id, chosenColor: color });
            }
          } else {
            moves.push({ type: 'play_card', cardId: card.id, chosenColor: color });
          }
        }
      } else {
        moves.push({ type: 'play_card', cardId: card.id });
      }
    }
  }

  // Can only draw if no playable cards exist
  if (moves.length === 0) {
    moves.push({ type: 'draw_card' });
  }

  // SpellStack call if down to one card
  if (playerHand.length === 1 && state.settings.spellCallRequired) {
    moves.push({ type: 'call_uno' });
  }

  return moves;
}

/**
 * Check if a card can be played on top of another card
 */
function isCardPlayable(card: Card, topCard: Card, currentColor: CardColor): boolean {
  // Wild cards can always be played
  if (card.type === CardType.Wild || card.type === CardType.WildDrawFour) {
    return true;
  }

  // Match color
  if (card.color === currentColor) {
    return true;
  }

  // Match type (number or action)
  if (card.type === topCard.type) {
    if (card.type === CardType.Number && card.value === topCard.value) {
      return true;
    } else if (card.type !== CardType.Number) {
      return true;
    }
  }

  return false;
}

/**
 * Apply a move to the game state (pure function)
 */
export function applyMove(state: GameState, move: Move, rng?: RNG): GameState {
  if (state.phase !== GamePhase.Playing) {
    throw new Error('Cannot apply move outside of playing phase');
  }

  const currentRng = rng || new RNG(state.seed + state.discardPile.length);
  const newState = JSON.parse(JSON.stringify(state)) as GameState;

  switch (move.type) {
    case 'play_card':
      return applyPlayCard(newState, move.cardId, move.chosenColor, currentRng);
    case 'draw_card':
      return applyDrawCard(newState, currentRng);
    case 'pass_turn':
      return applyPassTurn(newState);
    case 'call_uno':
      return applyCallUno(newState);
    default:
      throw new Error(`Unknown move type: ${(move as any).type}`);
  }
}

function applyPlayCard(
  state: GameState, 
  cardId: string, 
  chosenColor?: CardColor,
  rng?: RNG
): GameState {
  const playerId = state.currentPlayerId;
  const playerHand = state.playerHands[playerId];
  const cardIndex = playerHand.findIndex(c => c.id === cardId);
  
  if (cardIndex === -1) {
    throw new Error('Player does not have this card');
  }

  const card = playerHand[cardIndex];
  
  // Validate move is legal
  const legal = legalMoves(state, playerId);
  const isLegal = legal.some(move => 
    move.type === 'play_card' && 
    move.cardId === cardId &&
    move.chosenColor === chosenColor
  );
  
  if (!isLegal) {
    throw new Error('Illegal move');
  }

  // Remove card from hand
  state.playerHands[playerId].splice(cardIndex, 1);
  state.players.find(p => p.id === playerId)!.handSize--;

  // Add to discard pile
  state.discardPile.push(card);
  state.topCard = card;

  // Handle card effects
  handleCardEffect(state, card, chosenColor, rng);

  // Reset draw state
  state.canPlayDrawnCard = false;
  state.lastDrawnCard = undefined;

  // Check for round end
  if (state.playerHands[playerId].length === 0) {
    state.phase = GamePhase.RoundEnd;
    return state;
  }

  // Advance turn (Skip cards handle their own turn advancement)
  if (card.type !== CardType.Skip) {
    advanceTurn(state);
  }

  return state;
}

function applyDrawCard(state: GameState, rng: RNG): GameState {
  const playerId = state.currentPlayerId;
  const drawAmount = Math.max(1, state.drawCount);
  
  // Draw cards
  for (let i = 0; i < drawAmount; i++) {
    const card = drawCardFromPile(state, rng);
    if (card) {
      state.playerHands[playerId].push(card);
      state.players.find(p => p.id === playerId)!.handSize++;
      
      // If drawing one card voluntarily (not due to +2/+4), allow choice to play or pass
      if (drawAmount === 1 && i === 0 && state.drawCount === 0) {
        state.lastDrawnCard = card;
        state.canPlayDrawnCard = true;
        // Don't advance turn yet - player gets to choose play or pass
        return state;
      }
    }
  }

  // Reset draw count and advance turn (for forced draws like +2/+4)
  state.drawCount = 0;
  advanceTurn(state);
  return state;
}

function applyPassTurn(state: GameState): GameState {
  // Reset draw state and advance turn
  state.canPlayDrawnCard = false;
  state.lastDrawnCard = undefined;
  advanceTurn(state);
  return state;
}

function applyCallUno(state: GameState): GameState {
  const playerId = state.currentPlayerId;
  const player = state.players.find(p => p.id === playerId)!;
  player.calledSpell = true;
  return state;
}

function handleCardEffect(
  state: GameState, 
  card: Card, 
  chosenColor?: CardColor,
  rng?: RNG
): void {
  switch (card.type) {
    case CardType.Skip:
      // Skip card: advance turn twice (current player + skip next player)
      advanceTurn(state);
      advanceTurn(state);
      break;
      
    case CardType.Reverse:
      // Reverse card: change direction but don't advance turn here
      state.direction = state.direction === Direction.Clockwise 
        ? Direction.CounterClockwise 
        : Direction.Clockwise;
      break;
      
    case CardType.DrawTwo:
      // Draw two: set draw count but don't advance turn here
      state.drawCount += 2;
      break;
      
    case CardType.Wild:
      // Wild card: set color but don't advance turn here
      state.currentColor = chosenColor || CardColor.Red;
      break;
      
    case CardType.WildDrawFour:
      // Wild +4: set color and draw count but don't advance turn here
      state.currentColor = chosenColor || CardColor.Red;
      state.drawCount += 4;
      break;
      
    default:
      // Number cards: set color but don't advance turn here
      state.currentColor = card.color;
      break;
  }
}

function advanceTurn(state: GameState): void {
  const currentIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
  const increment = state.direction === Direction.Clockwise ? 1 : -1;
  const nextIndex = (currentIndex + increment + state.players.length) % state.players.length;
  state.currentPlayerId = state.players[nextIndex].id;
}

function drawCardFromPile(state: GameState, rng: RNG): Card | null {
  if (state.drawPile.length === 0) {
    // Reshuffle discard pile into draw pile
    if (state.discardPile.length <= 1) {
      return null; // No cards left
    }
    
    const topCard = state.discardPile.pop()!;
    state.drawPile = rng.shuffle([...state.discardPile]);
    state.discardPile = [topCard];
  }
  
  return state.drawPile.pop() || null;
}

/**
 * Check if game is in terminal state
 */
export function isTerminal(state: GameState): boolean {
  return state.phase === GamePhase.RoundEnd || state.phase === GamePhase.GameEnd;
}

/**
 * Calculate game result and scores
 */
export function score(state: GameState): GameResult {
  const scores: Record<PlayerId, number> = {};
  let winner: PlayerId | null = null;

  for (const player of state.players) {
    const handScore = calculateHandScore(state.playerHands[player.id]);
    scores[player.id] = handScore;
    
    if (handScore === 0) {
      winner = player.id;
    }
  }

  return {
    winner,
    scores,
    isTerminal: isTerminal(state),
  };
}
