// Test automatic draw cards functionality
import { createGame, applyMove, applyAutomaticDrawCards, CardType, CardColor } from './packages/engine/dist/index.js';

const game = createGame({
  players: [
    { id: 'player1', name: 'Player 1', isBot: false },
    { id: 'player2', name: 'Player 2', isBot: false }
  ],
  seed: 'test'
});

console.log('Initial state:');
console.log('Current player:', game.currentPlayerId);
console.log('Draw count:', game.drawCount);
console.log('Player 1 hand size:', game.playerHands.player1.length);
console.log('Player 2 hand size:', game.playerHands.player2.length);

// Player 1 plays a +2 card
const currentPlayer = game.currentPlayerId;
const drawTwoCard = {
  id: 'test-draw-two',
  color: game.currentColor,
  type: CardType.DrawTwo
};

game.playerHands[currentPlayer].push(drawTwoCard);

const move = {
  type: 'play_card',
  cardId: 'test-draw-two'
};

console.log('\n--- Player 1 plays +2 card ---');
const state1 = applyMove(game, move);
console.log('Current player after +2:', state1.currentPlayerId);
console.log('Draw count:', state1.drawCount);

console.log('\n--- Testing automatic draw ---');
const state2 = applyAutomaticDrawCards(state1);
console.log('Draw count after auto-draw:', state2.drawCount);
console.log('Current player:', state2.currentPlayerId);
console.log('Player 2 hand size:', state2.playerHands.player2.length);
console.log('Cards automatically drawn!');
