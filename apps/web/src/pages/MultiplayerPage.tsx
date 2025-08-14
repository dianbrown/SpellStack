import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameSocket } from '../lib/useGameSocket';

export const MultiplayerPage: React.FC = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const { createRoom, connected, error } = useGameSocket();

  // Debug logging
  useEffect(() => {
    console.log('🔧 MultiplayerPage mounted');
    console.log('🔗 Socket connected:', connected);
    if (error) {
      console.log('❌ Socket error:', error);
    }
  }, [connected, error]);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsCreating(true);
    try {
      console.log('🎯 Creating room for player:', playerName);
      const result = await createRoom();
      
      if (result) {
        console.log('✅ Room created:', result);
        navigate(`/r/${result.roomCode}?host=true&hostKey=${encodeURIComponent(result.hostKey)}&name=${encodeURIComponent(playerName)}`);
      } else {
        console.error('❌ Failed to create room');
        alert('Failed to create room. Please try again.');
      }
    } catch (error) {
      console.error('💥 Error creating room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) {
      alert('Please enter a room code');
      return;
    }
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsJoining(true);
    const cleanCode = joinCode.trim().toUpperCase();
    navigate(`/r/${cleanCode}?name=${encodeURIComponent(playerName)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white text-center mb-4">
          🃏 SpellStack Multiplayer
        </h1>
        
        <p className="text-white/70 text-center text-sm mb-8">
          Up to 4 players can join a game room
        </p>

        {/* Connection Status */}
        <div className="mb-4 text-center">
          <div 
            data-testid="connection-status"
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            connected 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              connected ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            {connected ? 'Connected to server' : 'Connecting to server...'}
          </div>
          {error && (
            <div className="mt-2 text-red-400 text-sm">
              Error: {error.msg}
            </div>
          )}
          
          {/* Debug Info */}
          <div className="mt-2 text-xs text-white/40">
            <div>Host: {window.location.hostname}</div>
            <div>WebSocket: {import.meta.env.VITE_WS_URL || `http://${window.location.hostname}:8787`}</div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Player Name Input */}
          <div>
            <label htmlFor="playerName" className="block text-white/80 text-sm font-medium mb-2">
              Your Name
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              maxLength={20}
            />
          </div>

          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            disabled={isCreating || !playerName.trim()}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create New Room'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-br from-blue-900 to-purple-900 text-white/60">or</span>
            </div>
          </div>

          {/* Join Room Section */}
          <div>
            <label htmlFor="roomCode" className="block text-white/80 text-sm font-medium mb-2">
              Room Code
            </label>
            <input
              id="roomCode"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
              maxLength={6}
            />
          </div>

          <button
            onClick={handleJoinRoom}
            disabled={isJoining || !joinCode.trim() || !playerName.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
          >
            {isJoining ? 'Joining...' : 'Join Room'}
          </button>

          {/* Back to Solo */}
          <div className="text-center pt-4">
            <button
              onClick={() => navigate('/')}
              className="text-white/60 hover:text-white/80 text-sm underline"
            >
              ← Back to Solo Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
