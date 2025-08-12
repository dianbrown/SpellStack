import { describe, it, expect } from 'vitest';
import {
  createGame,
  legalMoves,
  applyMove,
  isTerminal,
  score,
  CardType,
  CardColor,
  Direction,
  GamePhase,
  CreateGameOptions,
} from '../index.js';

describe('UNO Engine', () => {
  const defaultPlayers = [
    { id: 'player1', name: 'Player 1' },
    { id: 'player2', name: 'Player 2' },
  ];

  const createTestGame = (options?: Partial<CreateGameOptions>) => {
    return createGame({
      players: defaultPlayers,
      seed: 'test-seed-123',
      ...options,
    });
  };

  describe('createGame', () => {
    it('should create a valid initial game state', () => {
      const game = createTestGame();

      expect(game.id).toBeDefined();
      expect(game.phase).toBe(GamePhase.Playing);
      expect(game.players).toHaveLength(2);
      expect(game.currentPlayerId).toBe('player1');
      expect(game.direction).toBe(Direction.Clockwise);
      expect(game.topCard).toBeDefined();
      expect(game.drawPile.length).toBeGreaterThan(0);
      expect(game.discardPile).toHaveLength(1);
      expect(Object.keys(game.playerHands)).toHaveLength(2);
    });

    it('should deal 7 cards to each player', () => {
      const game = createTestGame();

      for (const player of game.players) {
        expect(game.playerHands[player.id]).toHaveLength(7);
        expect(player.handSize).toBe(7);
      }
    });

    it('should not start with wild cards on top', () => {
      const game = createTestGame();
      
      expect(game.topCard.type).not.toBe(CardType.Wild);
      expect(game.topCard.type).not.toBe(CardType.WildDrawFour);
    });

    it('should throw error for invalid player count', () => {
      expect(() => {
        createGame({
          players: [{ id: 'player1', name: 'Player 1' }],
          seed: 'test',
        });
      }).toThrow('Game requires 2-4 players');

      expect(() => {
        createGame({
          players: Array.from({ length: 5 }, (_, i) => ({ 
            id: `player${i + 1}`, 
            name: `Player ${i + 1}` 
          })),
          seed: 'test',
        });
      }).toThrow('Game requires 2-4 players');
    });
  });

  describe('legalMoves', () => {
    it('should return empty array for wrong player turn', () => {
      const game = createTestGame();
      const moves = legalMoves(game, 'player2');
      expect(moves).toHaveLength(0);
    });

    it('should return empty array for wrong game phase', () => {
      const game = createTestGame();
      game.phase = GamePhase.RoundEnd;
      
      const moves = legalMoves(game, game.currentPlayerId);
      expect(moves).toHaveLength(0);
    });

    it('should always include draw_card move when no playable cards', () => {
      const game = createTestGame();
      // Clear player hand to force draw
      game.playerHands[game.currentPlayerId] = [];
      
      const moves = legalMoves(game, game.currentPlayerId);
      expect(moves.some(move => move.type === 'draw_card')).toBe(true);
    });

    it('should include wild card moves with color choices', () => {
      const game = createTestGame();
      const playerId = game.currentPlayerId;
      
      // Add wild card to player hand
      const wildCard = {
        id: 'wild-test',
        color: CardColor.Wild,
        type: CardType.Wild,
      };
      game.playerHands[playerId].push(wildCard);
      
      const moves = legalMoves(game, playerId);
      const wildMoves = moves.filter(move => 
        move.type === 'play_card' && move.cardId === 'wild-test'
      );
      
      expect(wildMoves).toHaveLength(4); // 4 color choices
      expect(wildMoves.every(move => move.chosenColor)).toBe(true);
    });
  });

  describe('applyMove', () => {
    it('should apply play_card move correctly', () => {
      const game = createTestGame();
      const playerId = game.currentPlayerId;
      const initialHandSize = game.playerHands[playerId].length;
      const cardToPlay = game.playerHands[playerId][0];
      
      const move = { type: 'play_card' as const, cardId: cardToPlay.id };
      const legal = legalMoves(game, playerId);
      
      // Only test if move is legal
      if (legal.some(m => m.type === 'play_card' && m.cardId === cardToPlay.id)) {
        const newState = applyMove(game, move);
        
        expect(newState.playerHands[playerId]).toHaveLength(initialHandSize - 1);
        expect(newState.topCard.id).toBe(cardToPlay.id);
        expect(newState.discardPile[newState.discardPile.length - 1].id).toBe(cardToPlay.id);
      }
    });

    it('should handle skip card effect', () => {
      const game = createTestGame();
      const playerId = game.currentPlayerId;
      
      // Add skip card to hand
      const skipCard = {
        id: 'skip-test',
        color: CardColor.Red,
        type: CardType.Skip,
      };
      game.playerHands[playerId].push(skipCard);
      game.topCard = { id: 'red-1', color: CardColor.Red, type: CardType.Number, value: 1 };
      game.currentColor = CardColor.Red;
      
      const move = { type: 'play_card' as const, cardId: 'skip-test' };
      const newState = applyMove(game, move);
      
      // Should skip to the player after next
      expect(newState.currentPlayerId).toBe(game.currentPlayerId);
    });

    it('should handle reverse card effect', () => {
      const game = createTestGame();
      game.players.push({ id: 'player3', name: 'Player 3', isBot: false, handSize: 7, calledUno: false });
      game.playerHands['player3'] = Array(7).fill(null).map((_, i) => ({
        id: `p3-card-${i}`,
        color: CardColor.Blue,
        type: CardType.Number,
        value: i,
      }));
      
      const playerId = game.currentPlayerId;
      
      // Add reverse card to hand
      const reverseCard = {
        id: 'reverse-test',
        color: CardColor.Red,
        type: CardType.Reverse,
      };
      game.playerHands[playerId].push(reverseCard);
      game.topCard = { id: 'red-1', color: CardColor.Red, type: CardType.Number, value: 1 };
      game.currentColor = CardColor.Red;
      
      const initialDirection = game.direction;
      const move = { type: 'play_card' as const, cardId: 'reverse-test' };
      const newState = applyMove(game, move);
      
      expect(newState.direction).not.toBe(initialDirection);
    });

    it('should handle draw two card effect', () => {
      const game = createTestGame();
      const playerId = game.currentPlayerId;
      
      // Add draw two card to hand
      const drawTwoCard = {
        id: 'draw-two-test',
        color: CardColor.Red,
        type: CardType.DrawTwo,
      };
      game.playerHands[playerId].push(drawTwoCard);
      game.topCard = { id: 'red-1', color: CardColor.Red, type: CardType.Number, value: 1 };
      game.currentColor = CardColor.Red;
      
      const move = { type: 'play_card' as const, cardId: 'draw-two-test' };
      const newState = applyMove(game, move);
      
      expect(newState.drawCount).toBe(2);
    });

    it('should throw error for illegal move', () => {
      const game = createTestGame();
      const playerId = game.currentPlayerId;
      
      // Try to play a card not in hand
      const move = { type: 'play_card' as const, cardId: 'non-existent-card' };
      
      expect(() => applyMove(game, move)).toThrow();
    });
  });

  describe('isTerminal and score', () => {
    it('should detect terminal state when round ends', () => {
      const game = createTestGame();
      game.phase = GamePhase.RoundEnd;
      
      expect(isTerminal(game)).toBe(true);
    });

    it('should calculate winner when player has no cards', () => {
      const game = createTestGame();
      const playerId = game.currentPlayerId;
      
      // Empty player hand
      game.playerHands[playerId] = [];
      game.players.find(p => p.id === playerId)!.handSize = 0;
      game.phase = GamePhase.RoundEnd;
      
      const result = score(game);
      expect(result.winner).toBe(playerId);
      expect(result.scores[playerId]).toBe(0);
      expect(result.isTerminal).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle wild draw four legality check', () => {
      const game = createTestGame();
      const playerId = game.currentPlayerId;
      
      // Set up scenario where wild +4 should be illegal (player has matching color)
      game.currentColor = CardColor.Red;
      game.playerHands[playerId] = [
        { id: 'red-card', color: CardColor.Red, type: CardType.Number, value: 5 },
        { id: 'wild-4', color: CardColor.Wild, type: CardType.WildDrawFour },
      ];
      
      const moves = legalMoves(game, playerId);
      const wildMoves = moves.filter(move => 
        move.type === 'play_card' && move.cardId === 'wild-4'
      );
      
      // Wild +4 should not be legal when player has matching color
      expect(wildMoves).toHaveLength(0);
    });

    it('should handle deck reshuffling when draw pile is empty', () => {
      const game = createTestGame();
      const playerId = game.currentPlayerId;
      
      // Force empty draw pile
      game.drawPile = [];
      game.discardPile = [
        game.discardPile[0], // Keep top card
        { id: 'card1', color: CardColor.Blue, type: CardType.Number, value: 1 },
        { id: 'card2', color: CardColor.Green, type: CardType.Number, value: 2 },
      ];
      
      const move = { type: 'draw_card' as const };
      const newState = applyMove(game, move);
      
      expect(newState.playerHands[playerId].length).toBeGreaterThan(game.playerHands[playerId].length);
      expect(newState.drawPile.length).toBeGreaterThan(0);
    });
  });
});
