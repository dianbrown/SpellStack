import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">
          SpellStack
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Play the classic card game online with friends or against AI
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Singleplayer */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Play Solo</h2>
            <p className="text-gray-600 mb-6">
              Challenge AI opponents in offline mode. Perfect for practice or when you're alone.
            </p>
            <Link
              to="/solo"
              className="btn-primary inline-block"
            >
              Start Solo Game
            </Link>
          </div>

          {/* Multiplayer */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Play with Friends</h2>
            <p className="text-gray-600 mb-6">
              Create a room and invite friends to play together online in real-time.
            </p>
            <Link
              to="/multiplayer"
              className="btn-primary inline-block"
            >
              Play Multiplayer
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">📱</div>
              <h4 className="font-semibold mb-2">PWA Support</h4>
              <p className="text-sm text-gray-600">Install on your device and play offline</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🎵</div>
              <h4 className="font-semibold mb-2">Sound Effects</h4>
              <p className="text-sm text-gray-600">Immersive audio experience</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🎨</div>
              <h4 className="font-semibold mb-2">Animations</h4>
              <p className="text-sm text-gray-600">Smooth card animations and effects</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
