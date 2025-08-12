import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SoloGamePage: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);

  if (!gameStarted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Solo Game</h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-6xl mb-6">🎮</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Play?</h2>
            <p className="text-gray-600 mb-8">
              Challenge AI opponents in a classic game of UNO. 
              First to empty your hand wins!
            </p>
            <button
              onClick={() => setGameStarted(true)}
              className="btn-primary text-lg px-8 py-4"
            >
              Start New Game
            </button>
            <div className="mt-6">
              <Link to="/" className="text-blue-600 hover:underline">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Game Started!</h1>
        <p className="text-gray-600 mb-4">Game engine integration coming soon...</p>
        <button
          onClick={() => setGameStarted(false)}
          className="btn-secondary mr-4"
        >
          Back to Setup
        </button>
        <Link to="/" className="btn-secondary">
          Home
        </Link>
      </div>
    </div>
  );
};

export default SoloGamePage;
