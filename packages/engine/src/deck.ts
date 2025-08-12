import seedrandom from 'seedrandom';
import { Card, CardColor, CardType } from './types.js';

export class RNG {
  private rng: seedrandom.PRNG;

  constructor(seed: string) {
    this.rng = seedrandom(seed);
  }

  /**
   * Generate a random float between 0 and 1
   */
  random(): number {
    return this.rng();
  }

  /**
   * Generate a random integer between min and max (inclusive)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Shuffle an array in place using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Pick a random element from an array
   */
  choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    return array[this.randomInt(0, array.length - 1)];
  }
}

/**
 * Create a standard UNO deck
 */
export function createDeck(): Card[] {
  const cards: Card[] = [];
  let cardId = 0;

  // Number cards (0-9) for each color
  for (const color of [CardColor.Red, CardColor.Green, CardColor.Blue, CardColor.Yellow]) {
    // One 0 card per color
    cards.push({
      id: `card-${cardId++}`,
      color,
      type: CardType.Number,
      value: 0,
    });

    // Two of each number 1-9 per color
    for (let num = 1; num <= 9; num++) {
      for (let copy = 0; copy < 2; copy++) {
        cards.push({
          id: `card-${cardId++}`,
          color,
          type: CardType.Number,
          value: num,
        });
      }
    }

    // Action cards - two of each per color
    const actionTypes = [CardType.Skip, CardType.Reverse, CardType.DrawTwo];
    for (const actionType of actionTypes) {
      for (let copy = 0; copy < 2; copy++) {
        cards.push({
          id: `card-${cardId++}`,
          color,
          type: actionType,
        });
      }
    }
  }

  // Wild cards - 4 of each
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `card-${cardId++}`,
      color: CardColor.Wild,
      type: CardType.Wild,
    });
  }

  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `card-${cardId++}`,
      color: CardColor.Wild,
      type: CardType.WildDrawFour,
    });
  }

  return cards;
}

/**
 * Deal initial hands to players
 */
export function dealCards(
  deck: Card[], 
  playerIds: string[], 
  cardsPerPlayer: number = 7
): { hands: Record<string, Card[]>; remainingDeck: Card[] } {
  const hands: Record<string, Card[]> = {};
  let currentDeck = [...deck];

  // Initialize empty hands
  for (const playerId of playerIds) {
    hands[playerId] = [];
  }

  // Deal cards
  for (let round = 0; round < cardsPerPlayer; round++) {
    for (const playerId of playerIds) {
      if (currentDeck.length === 0) {
        throw new Error('Not enough cards in deck to deal');
      }
      const card = currentDeck.pop()!;
      hands[playerId].push(card);
    }
  }

  return {
    hands,
    remainingDeck: currentDeck,
  };
}

/**
 * Get card point value for scoring
 */
export function getCardPoints(card: Card): number {
  switch (card.type) {
    case CardType.Number:
      return card.value || 0;
    case CardType.Skip:
    case CardType.Reverse:
    case CardType.DrawTwo:
      return 20;
    case CardType.Wild:
    case CardType.WildDrawFour:
      return 50;
    default:
      return 0;
  }
}

/**
 * Calculate hand score (sum of card points)
 */
export function calculateHandScore(hand: Card[]): number {
  return hand.reduce((sum, card) => sum + getCardPoints(card), 0);
}
