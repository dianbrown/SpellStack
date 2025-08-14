import React from 'react';
import { motion } from 'framer-motion';
import { Card as GameCard, CardColor } from '@spellstack/engine';
import { GameTable } from './GameTable';
import { Hand, OpponentHand } from './Hand';

interface Player {
  id: string;
  name: string;
  handSize: number;
}

interface CircularGameTableProps {
  // Game state
  topCard?: GameCard;
  currentColor?: CardColor;
  drawPileSize: number;
  direction: 'clockwise' | 'counterclockwise';
  
  // Players
  players: Player[];
  currentPlayerId?: string;
  myPlayerId?: string;
  
  // My hand
  myHand: GameCard[];
  playableCardIds?: string[];
  onCardSelect?: (cardId: string) => void;
  onDrawCard?: () => void;
  onLeave?: () => void;
  
  // Game actions
  canDraw?: boolean;
  canPass?: boolean;
  onPassTurn?: () => void;
}

export const CircularGameTable: React.FC<CircularGameTableProps> = ({
  topCard,
  currentColor,
  drawPileSize,
  direction,
  players,
  currentPlayerId,
  myPlayerId,
  myHand,
  playableCardIds = [],
  onCardSelect,
  onDrawCard,
  onLeave,
  canDraw = false,
  canPass = false,
  onPassTurn,
}) => {
  // Arrange players in proper turn order relative to current player
  const myPlayerIndex = players.findIndex(p => p.id === myPlayerId);
  const sortedOtherPlayers = [];
  
  // Arrange players in clockwise order starting from position across from me
  if (direction === 'clockwise') {
    // Clockwise: next player after me goes to position 0 (top), then right, then left
    for (let i = 1; i < players.length; i++) {
      const playerIndex = (myPlayerIndex + i) % players.length;
      const player = players[playerIndex];
      if (player.id !== myPlayerId) {
        sortedOtherPlayers.push(player);
      }
    }
  } else {
    // Counterclockwise: arrange in reverse order
    for (let i = 1; i < players.length; i++) {
      const playerIndex = (myPlayerIndex - i + players.length) % players.length;
      const player = players[playerIndex];
      if (player.id !== myPlayerId) {
        sortedOtherPlayers.push(player);
      }
    }
  }

  // Direction arrow component
  const DirectionArrow: React.FC<{ direction: 'clockwise' | 'counterclockwise' }> = ({ direction }) => (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 z-20">
      <span className="text-white text-sm font-medium">
        {direction === 'clockwise' ? 'Clockwise' : 'Counter-clockwise'}
      </span>
      <motion.div
        animate={{ rotate: direction === 'clockwise' ? 360 : -360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="text-white text-lg"
      >
        {direction === 'clockwise' ? '↻' : '↺'}
      </motion.div>
    </div>
  );

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Header with room info and controls */}
      <div className="absolute top-4 left-4 z-20">
        <h1 className="text-xl font-bold text-white">Game Room</h1>
      </div>
      
      {/* Leave Game Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={onLeave}
          className="px-4 py-2 bg-red-600/80 hover:bg-red-600 backdrop-blur-sm text-white rounded-lg transition-colors"
        >
          Leave Game
        </button>
      </div>
      
      {/* Direction indicator */}
      <DirectionArrow direction={direction} />
      
      {/* Center deck area - ONLY the deck, no other elements */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        {topCard && currentColor && (
          <GameTable
            topCard={topCard}
            currentColor={currentColor}
            drawPileSize={drawPileSize}
            onDrawCard={undefined} // Remove draw functionality from center
          />
        )}
      </div>
      
      {/* Game Actions - positioned at bottom-left corner */}
      {currentPlayerId === myPlayerId && (canDraw || canPass) && (
        <div className="absolute bottom-8 left-8 z-20">
          <div className="flex flex-col gap-3">
            {canDraw && (
              <button
                onClick={onDrawCard}
                className="px-5 py-3 bg-yellow-600/90 hover:bg-yellow-600 backdrop-blur-sm text-white rounded-lg transition-colors shadow-lg font-semibold min-w-[120px]"
              >
                Draw Card
              </button>
            )}
            
            {canPass && (
              <button
                onClick={onPassTurn}
                className="px-5 py-3 bg-blue-600/90 hover:bg-blue-600 backdrop-blur-sm text-white rounded-lg transition-colors shadow-lg font-semibold min-w-[120px]"
              >
                Pass Turn
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Other players positioned in rectangular layout around deck */}
      {sortedOtherPlayers.slice(0, 3).map((player, index) => {
        // Fixed rectangular positions around the center deck - clockwise order
        let x, y, rotation = 0;
        
        switch (index) {
          case 0:
            // First player: directly across from you (top center) - adjusted for visual centering
            x = '48vw'; // Slightly left to compensate for OpponentHand layout
            y = '20vh';
            rotation = 180; // Rotated to face toward center
            break;
          case 1:
            // Second player: to the right of center deck (clockwise from top)
            x = '80vw';
            y = '50vh';
            rotation = -90; // Rotated to face left toward center
            break;
          case 2:
            // Third player: to the left of center deck (clockwise from right)
            x = '20vw';
            y = '50vh';
            rotation = 90; // Rotated to face right toward center
            break;
          default:
            x = '48vw';
            y = '20vh';
            rotation = 180;
        }
        
        const isCurrentPlayer = currentPlayerId === player.id;
        
        return (
          <motion.div
            key={player.id}
            className="absolute z-15"
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Player info and cards with rotation */}
            <div 
              className="flex flex-col items-center"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            >
              {/* Player cards (showing backs) */}
              <div className="mb-2">
                <OpponentHand
                  playerName={player.name}
                  cardCount={player.handSize}
                  isCurrentPlayer={isCurrentPlayer}
                />
              </div>
              
              {/* Current player indicator */}
              {isCurrentPlayer && (
                <motion.div
                  className="absolute -inset-6 border-3 border-yellow-400 rounded-xl bg-yellow-400/10"
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(250, 204, 21, 0.7)',
                      '0 0 0 20px rgba(250, 204, 21, 0)',
                    ],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </div>
          </motion.div>
        );
      })}
      
      {/* Current player's hand at bottom with protective spacing */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-5xl px-4 z-20">
        {/* Invisible protective zone to prevent overlap */}
        <div className="absolute -top-32 left-0 right-0 h-40 pointer-events-none" />
        
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="text-center mb-3">
            <h3 className="text-white text-lg font-semibold">
              Your Hand ({myHand.length} cards)
              {currentPlayerId === myPlayerId && (
                <span className="ml-2 text-yellow-400 text-sm">• Your Turn</span>
              )}
            </h3>
          </div>
          <Hand
            cards={myHand}
            playableCards={playableCardIds}
            isCurrentPlayer={currentPlayerId === myPlayerId}
            onCardSelect={onCardSelect}
          />
        </div>
      </div>
    </div>
  );
};
