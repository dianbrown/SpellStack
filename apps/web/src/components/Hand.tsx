import React from 'react';
import { motion } from 'framer-motion';
import { Card as GameCard } from '@spellstack/engine';
import { Card } from './Card';

interface HandProps {
  cards: GameCard[];
  playableCards?: string[]; // Card IDs that can be played
  selectedCard?: string;
  onCardSelect?: (cardId: string) => void;
  isCurrentPlayer?: boolean;
}

export const Hand: React.FC<HandProps> = ({
  cards,
  playableCards = [],
  selectedCard,
  onCardSelect,
  isCurrentPlayer = false,
}) => {
  const maxCards = 15; // Max cards to show without scrolling
  const shouldScroll = cards.length > maxCards;

  return (
    <div className="w-full">
      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden">
        <div 
          className={`
            flex gap-2 pb-4
            ${shouldScroll ? 'overflow-x-auto' : 'justify-center'}
          `}
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#4B5563 transparent'
          }}
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="flex-shrink-0"
            >
              <Card
                card={card}
                isPlayable={playableCards.includes(card.id)}
                isSelected={selectedCard === card.id}
                onClick={isCurrentPlayer ? () => onCardSelect?.(card.id) : undefined}
                size="medium"
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Desktop: Fan layout */}
      <div className="hidden md:block">
        <div className="relative h-32 flex items-end justify-center">
          {cards.map((card, index) => {
            const totalCards = cards.length;
            const maxSpread = Math.min(totalCards * 8, 200); // Max spread of 200px
            const cardSpacing = totalCards > 1 ? maxSpread / (totalCards - 1) : 0;
            const rotation = totalCards > 1 ? (index - (totalCards - 1) / 2) * 3 : 0; // Max 3 degrees per card
            const xOffset = totalCards > 1 ? (index * cardSpacing) - (maxSpread / 2) : 0;
            const yOffset = Math.abs(rotation) * 2; // Slight arc effect

            return (
              <motion.div
                key={card.id}
                className="absolute"
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  y: yOffset,
                  scale: 1,
                  x: xOffset,
                  rotate: rotation,
                }}
                transition={{ 
                  delay: index * 0.05, 
                  duration: 0.4,
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }}
                whileHover={isCurrentPlayer ? {
                  y: yOffset - 20,
                  scale: 1.1,
                  zIndex: 10,
                  rotate: rotation * 0.5,
                } : {}}
                style={{ zIndex: index }}
              >
                <Card
                  card={card}
                  isPlayable={playableCards.includes(card.id)}
                  isSelected={selectedCard === card.id}
                  onClick={isCurrentPlayer ? () => onCardSelect?.(card.id) : undefined}
                  size="medium"
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Hand info */}
      {cards.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No cards in hand
        </div>
      )}
    </div>
  );
};

// Component for showing opponent hands (just card count and backs)
export const OpponentHand: React.FC<{
  playerName: string;
  cardCount: number;
  isCurrentPlayer?: boolean;
  position?: 'top' | 'left' | 'right';
}> = ({ 
  playerName, 
  cardCount, 
  isCurrentPlayer = false,
  position = 'top',
}) => {
  const positionClasses = {
    top: 'flex-col items-center',
    left: 'flex-col items-start',
    right: 'flex-col items-end',
  };

  return (
    <div className={`flex ${positionClasses[position]} gap-2`}>
      <div className={`
        text-sm font-semibold px-3 py-1 rounded-full
        ${isCurrentPlayer 
          ? 'bg-yellow-400 text-black' 
          : 'bg-gray-200 text-gray-700'
        }
      `}>
        {playerName} ({cardCount})
      </div>
      
      <div className="flex gap-1">
        {Array.from({ length: Math.min(cardCount, 10) }, (_, i) => (
          <motion.div
            key={i}
            className="card card-back w-8 h-12 flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            style={{ marginLeft: i > 0 ? '-6px' : '0' }}
          >
            <div className="h-full flex items-center justify-center">
              <div className="text-white text-xs font-bold">UNO</div>
            </div>
          </motion.div>
        ))}
        {cardCount > 10 && (
          <div className="text-xs text-gray-500 ml-2 flex items-center">
            +{cardCount - 10}
          </div>
        )}
      </div>
    </div>
  );
};
