import React from 'react';
import { motion } from 'framer-motion';
import { Card as GameCard, CardColor } from '@spellstack/engine';
import { Card, CardBack } from './Card';

interface GameTableProps {
  topCard: GameCard;
  currentColor: CardColor;
  drawPileSize: number;
  onDrawCard?: () => void;
  onColorChange?: (color: CardColor) => void;
  showColorPicker?: boolean;
}

const colorPickerColors = [
  { color: CardColor.Red, bgClass: 'bg-red-500', label: 'Red' },
  { color: CardColor.Green, bgClass: 'bg-green-500', label: 'Green' },
  { color: CardColor.Blue, bgClass: 'bg-blue-500', label: 'Blue' },
  { color: CardColor.Yellow, bgClass: 'bg-yellow-500', label: 'Yellow' },
];

export const GameTable: React.FC<GameTableProps> = ({
  topCard,
  currentColor,
  drawPileSize,
  onDrawCard,
  onColorChange,
  showColorPicker = false,
}) => {
  return (
    <div className="flex items-center justify-center gap-8 p-8">
      {/* Draw Pile */}
      <div className="flex flex-col items-center gap-2">
        <motion.div
          onClick={onDrawCard}
          className={`
            relative 
            ${onDrawCard ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}
          `}
          whileTap={onDrawCard ? { scale: 0.95 } : {}}
        >
          <CardBack size="large" />
          {drawPileSize > 1 && (
            <div className="absolute -top-1 -right-1 bg-gray-700 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {drawPileSize}
            </div>
          )}
        </motion.div>
        <div className="text-xs text-gray-600 text-center">
          Draw Pile
        </div>
      </div>

      {/* Current Color Indicator */}
      <div className="flex flex-col items-center gap-2">
        <motion.div
          className={`
            w-16 h-16 rounded-full border-4 border-white shadow-lg
            ${currentColor === CardColor.Red ? 'bg-red-500' : ''}
            ${currentColor === CardColor.Green ? 'bg-green-500' : ''}
            ${currentColor === CardColor.Blue ? 'bg-blue-500' : ''}
            ${currentColor === CardColor.Yellow ? 'bg-yellow-500' : ''}
          `}
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <div className="text-xs text-gray-600 text-center">
          Current Color
        </div>
      </div>

      {/* Discard Pile */}
      <div className="flex flex-col items-center gap-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card card={topCard} size="large" />
        </motion.div>
        <div className="text-xs text-gray-600 text-center">
          Discard Pile
        </div>
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && onColorChange && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-lg p-6 shadow-xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
              Choose a Color
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {colorPickerColors.map(({ color, bgClass, label }) => (
                <motion.button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={`
                    ${bgClass} text-white p-4 rounded-lg font-semibold
                    hover:scale-105 transition-transform
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// Direction indicator component
export const DirectionIndicator: React.FC<{ 
  direction: 'clockwise' | 'counter_clockwise';
}> = ({ direction }) => {
  const isClockwise = direction === 'clockwise';
  
  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 bg-white bg-opacity-80 rounded-full px-3 py-2 shadow-md">
      <motion.div
        className="text-2xl"
        animate={{ rotate: isClockwise ? 360 : -360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        {isClockwise ? '↻' : '↺'}
      </motion.div>
      <div className="text-xs text-gray-700">
        {isClockwise ? 'Clockwise' : 'Counter-clockwise'}
      </div>
    </div>
  );
};

// Turn indicator
export const TurnIndicator: React.FC<{
  currentPlayerName: string;
  timeLeft?: number;
}> = ({ currentPlayerName, timeLeft }) => {
  return (
    <motion.div
      className="bg-yellow-400 text-black px-6 py-3 rounded-full font-bold shadow-lg"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="text-center">
        <div className="text-lg">{currentPlayerName}'s Turn</div>
        {timeLeft !== undefined && (
          <div className="text-sm opacity-75">
            {timeLeft}s left
          </div>
        )}
      </div>
    </motion.div>
  );
};
