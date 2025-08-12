import React from 'react';
import { useParams } from 'react-router-dom';

const RoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Room: {roomCode}</h1>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-6xl mb-6">🚧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Coming Soon</h2>
          <p className="text-gray-600 mb-8">
            Multiplayer functionality is currently under development.
            For now, you can enjoy the solo game mode!
          </p>
          <div className="space-x-4">
            <a href="/solo" className="btn-primary">
              Play Solo
            </a>
            <a href="/" className="btn-secondary">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
