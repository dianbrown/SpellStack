import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [showFullHand, setShowFullHand] = useState(false);
  
  // Mobile pagination
  const cardsPerPage = 4; // Show 4 cards at a time on mobile
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(cards.length / cardsPerPage);
  const shouldPaginate = cards.length > cardsPerPage;
  
  const getCurrentPageCards = () => {
    const start = currentPage * cardsPerPage;
    const end = start + cardsPerPage;
    return cards.slice(start, end);
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="w-full relative">
      {/* Show Full Hand Button - Desktop only, for current player */}
      {isCurrentPlayer && (
        <div className="hidden md:flex justify-end mb-2">
          <button
            onClick={() => setShowFullHand(!showFullHand)}
            className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors shadow-sm"
          >
            {showFullHand ? 'Show normal view' : 'Show full hand'}
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {showFullHand ? (
          /* Full Hand Carousel View - Desktop */
          <motion.div
            key="carousel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="hidden md:block"
          >
            <div className="max-h-96 overflow-visible py-4">
              <div 
                className="flex gap-3 overflow-x-auto pb-4 pt-6"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#4B5563 rgba(255,255,255,0.2)'
                }}
              >
                {cards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.3 }}
                    className="flex-shrink-0"
                    whileHover={isCurrentPlayer ? { scale: 1.05, y: -5 } : {}}
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
          </motion.div>
        ) : (
          /* Normal Views */
          <motion.div
            key="normal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Mobile: Paginated view with navigation */}
            <div className="md:hidden">
              {/* Navigation buttons and page indicator */}
              {shouldPaginate && (
                <div className="flex justify-between items-center mb-3">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 0}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-full transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Prev
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/80">
                      {currentPage + 1} of {totalPages}
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === currentPage ? 'bg-blue-400' : 'bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage >= totalPages - 1}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-full transition-colors shadow-sm"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
              
              {/* Cards grid */}
              <div className="flex justify-center gap-2 pb-2 min-h-[120px]">
                <AnimatePresence mode="wait">
                  {getCurrentPageCards().map((card, index) => (
                    <motion.div
                      key={`${card.id}-${currentPage}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
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
                </AnimatePresence>
              </div>
              
              {/* Card count indicator */}
              {cards.length > 0 && (
                <div className="text-center text-xs text-white/60 mt-2">
                  Showing {Math.min((currentPage * cardsPerPage) + getCurrentPageCards().length, cards.length)} of {cards.length} cards
                </div>
              )}
            </div>

            {/* Desktop: Fan layout */}
            <div className="hidden md:block">
              <div className="relative h-32 flex items-center justify-center">
                {cards.map((card, index) => {
                  const totalCards = cards.length;
                  const maxSpread = Math.min(totalCards * 8, 200); // Max spread of 200px
                  const cardSpacing = totalCards > 1 ? maxSpread / (totalCards - 1) : 0;
                  const rotation = totalCards > 1 ? (index - (totalCards - 1) / 2) * 3 : 0; // Max 3 degrees per card
                  const xOffset = totalCards > 1 ? (index * cardSpacing) - (maxSpread / 2) : 0;
                  const yOffset = Math.abs(rotation) * 1; // Reduced arc effect and centered

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
          </motion.div>
        )}
      </AnimatePresence>

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
    <div className={`flex ${positionClasses[position]} gap-3`}>
      <div className={`
        text-base font-bold px-4 py-2 rounded-full border-2 shadow-lg
        ${isCurrentPlayer 
          ? 'bg-yellow-400 text-black border-yellow-300' 
          : 'bg-white/90 text-gray-800 border-white/50'
        }
      `}>
        {playerName} ({cardCount})
      </div>
      
      <div className="flex gap-1">
        {Array.from({ length: Math.min(cardCount, 8) }, (_, i) => (
          <motion.div
            key={i}
            className="card card-back w-12 h-16 flex-shrink-0 bg-blue-900 border-2 border-blue-800 rounded-lg shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            style={{ marginLeft: i > 0 ? '-8px' : '0' }}
          >
            <div className="h-full flex items-center justify-center">
              <div className="text-white text-xs font-bold transform rotate-90">SPELL</div>
            </div>
          </motion.div>
        ))}
        {cardCount > 8 && (
          <div className="text-sm text-white bg-black/50 rounded-full px-2 py-1 ml-2 flex items-center font-semibold">
            +{cardCount - 8}
          </div>
        )}
      </div>
    </div>
  );
};
