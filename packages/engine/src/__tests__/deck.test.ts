import { describe, it, expect } from 'vitest';
import { RNG, createDeck, dealCards, calculateHandScore, getCardPoints } from '../deck.js';
import { CardType, CardColor } from '../types.js';

describe('Deck and RNG', () => {
  describe('RNG', () => {
    it('should generate deterministic results with same seed', () => {
      const rng1 = new RNG('test-seed');
      const rng2 = new RNG('test-seed');
      
      expect(rng1.random()).toBe(rng2.random());
      expect(rng1.randomInt(1, 10)).toBe(rng2.randomInt(1, 10));
    });

    it('should generate different results with different seeds', () => {
      const rng1 = new RNG('seed1');
      const rng2 = new RNG('seed2');
      
      // Very unlikely to be equal (but not impossible)
      expect(rng1.random()).not.toBe(rng2.random());
    });

    it('should shuffle arrays deterministically', () => {
      const array1 = [1, 2, 3, 4, 5];
      const array2 = [1, 2, 3, 4, 5];
      
      const rng1 = new RNG('shuffle-test');
      const rng2 = new RNG('shuffle-test');
      
      const shuffled1 = rng1.shuffle(array1);
      const shuffled2 = rng2.shuffle(array2);
      
      expect(shuffled1).toEqual(shuffled2);
    });

    it('should pick random elements', () => {
      const rng = new RNG('choice-test');
      const array = ['a', 'b', 'c', 'd', 'e'];
      
      const choice = rng.choice(array);
      expect(array).toContain(choice);
    });

    it('should throw error when picking from empty array', () => {
      const rng = new RNG('empty-test');
      expect(() => rng.choice([])).toThrow('Cannot pick from empty array');
    });
  });

  describe('createDeck', () => {
    it('should create a deck with correct number of cards', () => {
      const deck = createDeck();
      
      // Standard UNO deck: 108 cards
      // 76 number cards (19 per color: one 0, two each of 1-9)
      // 32 action cards (8 per color: 2 each of Skip, Reverse, Draw Two)
      // 8 wild cards (4 Wild, 4 Wild Draw Four)
      expect(deck).toHaveLength(108);
    });

    it('should have correct number of each card type', () => {
      const deck = createDeck();
      
      // Count by type
      const typeCounts = {
        [CardType.Number]: 0,
        [CardType.Skip]: 0,
        [CardType.Reverse]: 0,
        [CardType.DrawTwo]: 0,
        [CardType.Wild]: 0,
        [CardType.WildDrawFour]: 0,
      };

      for (const card of deck) {
        typeCounts[card.type]++;
      }

      expect(typeCounts[CardType.Number]).toBe(76); // 19 per color × 4 colors
      expect(typeCounts[CardType.Skip]).toBe(8); // 2 per color × 4 colors
      expect(typeCounts[CardType.Reverse]).toBe(8);
      expect(typeCounts[CardType.DrawTwo]).toBe(8);
      expect(typeCounts[CardType.Wild]).toBe(4);
      expect(typeCounts[CardType.WildDrawFour]).toBe(4);
    });

    it('should have correct color distribution', () => {
      const deck = createDeck();
      
      const colorCounts = {
        [CardColor.Red]: 0,
        [CardColor.Green]: 0,
        [CardColor.Blue]: 0,
        [CardColor.Yellow]: 0,
        [CardColor.Wild]: 0,
      };

      for (const card of deck) {
        colorCounts[card.color]++;
      }

      // Each regular color should have 25 cards (19 numbers + 6 actions)
      expect(colorCounts[CardColor.Red]).toBe(25);
      expect(colorCounts[CardColor.Green]).toBe(25);
      expect(colorCounts[CardColor.Blue]).toBe(25);
      expect(colorCounts[CardColor.Yellow]).toBe(25);
      expect(colorCounts[CardColor.Wild]).toBe(8);
    });

    it('should have unique card IDs', () => {
      const deck = createDeck();
      const ids = deck.map(card => card.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(deck.length);
    });
  });

  describe('dealCards', () => {
    it('should deal correct number of cards to each player', () => {
      const deck = createDeck();
      const playerIds = ['p1', 'p2', 'p3'];
      const cardsPerPlayer = 7;
      
      const result = dealCards(deck, playerIds, cardsPerPlayer);
      
      for (const playerId of playerIds) {
        expect(result.hands[playerId]).toHaveLength(cardsPerPlayer);
      }
      
      expect(result.remainingDeck).toHaveLength(deck.length - (playerIds.length * cardsPerPlayer));
    });

    it('should not duplicate cards between players', () => {
      const deck = createDeck();
      const playerIds = ['p1', 'p2'];
      
      const result = dealCards(deck, playerIds, 7);
      
      const allDealtCards = [
        ...result.hands.p1,
        ...result.hands.p2,
        ...result.remainingDeck,
      ];
      
      const cardIds = allDealtCards.map(card => card.id);
      const uniqueIds = new Set(cardIds);
      
      expect(uniqueIds.size).toBe(allDealtCards.length);
    });

    it('should throw error if not enough cards', () => {
      const smallDeck = createDeck().slice(0, 10);
      const playerIds = ['p1', 'p2', 'p3', 'p4'];
      const cardsPerPlayer = 7; // Would need 28 cards but only have 10
      
      expect(() => dealCards(smallDeck, playerIds, cardsPerPlayer))
        .toThrow('Not enough cards in deck to deal');
    });
  });

  describe('Card scoring', () => {
    it('should calculate correct points for number cards', () => {
      for (let i = 0; i <= 9; i++) {
        const card = {
          id: `num-${i}`,
          color: CardColor.Red,
          type: CardType.Number,
          value: i,
        };
        expect(getCardPoints(card)).toBe(i);
      }
    });

    it('should calculate correct points for action cards', () => {
      const actionCards = [
        { type: CardType.Skip, expectedPoints: 20 },
        { type: CardType.Reverse, expectedPoints: 20 },
        { type: CardType.DrawTwo, expectedPoints: 20 },
        { type: CardType.Wild, expectedPoints: 50 },
        { type: CardType.WildDrawFour, expectedPoints: 50 },
      ];

      for (const { type, expectedPoints } of actionCards) {
        const card = {
          id: 'test-card',
          color: CardColor.Red,
          type,
        };
        expect(getCardPoints(card)).toBe(expectedPoints);
      }
    });

    it('should calculate hand score correctly', () => {
      const hand = [
        { id: '1', color: CardColor.Red, type: CardType.Number, value: 5 }, // 5 points
        { id: '2', color: CardColor.Blue, type: CardType.Skip }, // 20 points
        { id: '3', color: CardColor.Wild, type: CardType.Wild }, // 50 points
      ];
      
      expect(calculateHandScore(hand)).toBe(75);
    });

    it('should return 0 for empty hand', () => {
      expect(calculateHandScore([])).toBe(0);
    });
  });
});
