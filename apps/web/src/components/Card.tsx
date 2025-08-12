import React from 'react';
import { motion } from 'framer-motion';
import { Card as GameCard, CardColor, CardType } from '@spellstack/engine';

interface CardProps {
  card: GameCard;
  isPlayable?: boolean;
  isSelected?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  className?: string;
}

const colorClasses = {
  [CardColor.Red]: 'card-red',
  [CardColor.Green]: 'card-green',
  [CardColor.Blue]: 'card-blue',
  [CardColor.Yellow]: 'card-yellow',
  [CardColor.Wild]: 'card-wild',
};

const sizeClasses = {
  small: 'w-12 h-16',
  medium: 'w-16 h-24 md:w-20 md:h-28',
  large: 'w-20 h-28 md:w-24 md:h-32',
};

export const Card: React.FC<CardProps> = ({
  card,
  isPlayable = false,
  isSelected = false,
  size = 'medium',
  onClick,
  className = '',
}) => {
  const cardClass = colorClasses[card.color];
  const sizeClass = sizeClasses[size];

  const getCardContent = () => {
    if (card.type === CardType.Number) {
      return (
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold">{card.value}</div>
        </div>
      );
    }

    switch (card.type) {
      case CardType.Skip:
        return (
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold">⊘</div>
            <div className="text-xs">SKIP</div>
          </div>
        );
      case CardType.Reverse:
        return (
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold">↺</div>
            <div className="text-xs">REVERSE</div>
          </div>
        );
      case CardType.DrawTwo:
        return (
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold">+2</div>
            <div className="text-xs">DRAW</div>
          </div>
        );
      case CardType.Wild:
        return (
          <div className="text-center">
            <div className="text-sm md:text-base font-bold">WILD</div>
          </div>
        );
      case CardType.WildDrawFour:
        return (
          <div className="text-center">
            <div className="text-sm md:text-base font-bold">WILD</div>
            <div className="text-xl md:text-2xl font-bold">+4</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`
        card ${cardClass} ${sizeClass}
        ${isPlayable ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
        ${isSelected ? 'ring-2 ring-white ring-offset-2 scale-110' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      whileHover={onClick ? { y: -8, scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-full flex items-center justify-center p-2">
        {getCardContent()}
      </div>
      
      {/* Corner decorations for better UNO look */}
      <div className="absolute top-1 left-1 text-xs font-bold opacity-50">
        {card.type === CardType.Number ? card.value : ''}
      </div>
      <div className="absolute bottom-1 right-1 text-xs font-bold opacity-50 transform rotate-180">
        {card.type === CardType.Number ? card.value : ''}
      </div>
    </motion.div>
  );
};

// Card back component for hidden cards
export const CardBack: React.FC<{ size?: 'small' | 'medium' | 'large'; className?: string }> = ({
  size = 'medium',
  className = '',
}) => {
  const sizeClass = sizeClasses[size];

  return (
    <div className={`card card-back ${sizeClass} ${className}`}>
      <div className="h-full flex items-center justify-center">
        <div className="text-white font-bold text-lg">UNO</div>
      </div>
    </div>
  );
};
