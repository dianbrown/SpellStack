// Quick test to verify turn order fix
import { createGame, applyMove, CardType, CardColor } from './packages/engine/dist/index.js';

// Create a 4-player game like the solo game
const game = createGame({
  players: [
    { id: 'human', name: 'You', isBot: false },
    { id: 'ai1', name: 'Bot Alice', isBot: true },
    { id: 'ai2', name: 'Bot Bob', isBot: true },
    { id: 'ai3', name: 'Bot Charlie', isBot: true }
  ],
  seed: 'test123'
});

console.log('Initial turn order:');
console.log('Current player:', game.currentPlayerId);
console.log('Direction:', game.direction);
console.log('All players:', game.players.map(p => p.id));

// Test normal number card
const currentPlayer = game.currentPlayerId;
const playerHand = game.playerHands[currentPlayer];

// Find a number card to play
let numberCard = playerHand.find(card => 
  card.type === 'number' && 
  (card.color === game.currentColor || card.value === game.topCard.value)
);

if (!numberCard) {
  // If no matching number card, add one for testing
  numberCard = {
    id: 'test-number',
    color: game.currentColor,
    type: CardType.Number,
    value: 1
  };
  game.playerHands[currentPlayer].push(numberCard);
}

console.log('\n--- Playing number card ---');
console.log('Playing card:', numberCard);
console.log('Current player before:', game.currentPlayerId);

const state1 = applyMove(game, {
  type: 'play_card',
  cardId: numberCard.id
});

console.log('Current player after number card:', state1.currentPlayerId);

// Test reverse card
const currentPlayer2 = state1.currentPlayerId;
const reverseCard = {
  id: 'test-reverse',
  color: state1.currentColor,
  type: CardType.Reverse
};
state1.playerHands[currentPlayer2].push(reverseCard);

console.log('\n--- Playing reverse card ---');
console.log('Current player before:', state1.currentPlayerId);
console.log('Direction before:', state1.direction);

const state2 = applyMove(state1, {
  type: 'play_card',
  cardId: reverseCard.id
});

console.log('Current player after reverse:', state2.currentPlayerId);
console.log('Direction after:', state2.direction);

// Test skip card
const currentPlayer3 = state2.currentPlayerId;
const skipCard = {
  id: 'test-skip',
  color: state2.currentColor,
  type: CardType.Skip
};
state2.playerHands[currentPlayer3].push(skipCard);

console.log('\n--- Playing skip card ---');
console.log('Current player before:', state2.currentPlayerId);

const state3 = applyMove(state2, {
  type: 'play_card',
  cardId: skipCard.id
});

console.log('Current player after skip:', state3.currentPlayerId);
console.log('(Should have skipped one player)');
