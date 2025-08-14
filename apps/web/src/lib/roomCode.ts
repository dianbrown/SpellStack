// Simple room code generator for readable codes
const ADJECTIVES = [
  'SWIFT', 'BRAVE', 'MAGIC', 'ROYAL', 'WILD', 'NOBLE', 'FIRE', 'STORM',
  'LUNAR', 'SOLAR', 'FROST', 'EMBER', 'STEEL', 'GOLD', 'JADE', 'RUBY'
];

const NOUNS = [
  'WOLF', 'HAWK', 'BEAR', 'LION', 'DEER', 'FOX', 'STAR', 'MOON',
  'FIRE', 'WIND', 'ROCK', 'TREE', 'LAKE', 'PEAK', 'CAVE', 'ISLE'
];

export function generateRoomCode(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  return `${adj}${noun}${num}`.substring(0, 6).toUpperCase();
}
