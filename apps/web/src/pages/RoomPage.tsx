import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useGameSocket } from '../lib/useGameSocket';
import { Hand } from '../components/Hand';
import { GameTable } from '../components/GameTable';

export const RoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const isHost = searchParams.get('host') === 'true';
  const playerName = searchParams.get('name') || 'Anonymous';
  const urlHostKey = searchParams.get('hostKey'); // Get hostKey from URL if present
  
  const {
    connected,
    error,
    redactedState: gameState,
    seats,
    you: playerId,
    hostKey,
    joinRoom,
    startGame,
    sendMove,
    leaveRoom
  } = useGameSocket();

  const [showCopySuccess, setShowCopySuccess] = useState(false);

  useEffect(() => {
    if (!roomCode) {
      navigate('/multiplayer');
      return;
    }

    console.log('🎯 RoomPage: Attempting to join room:', roomCode, 'as', playerName);
    // Always try to join the room, regardless of connection state
    // The joinRoom function will handle connection internally
    joinRoom(roomCode, playerName);
  }, [roomCode, playerName, joinRoom, navigate]);

  const handleStartGame = () => {
    // Use hostKey from URL if available, otherwise from socket state
    const keyToUse = urlHostKey || hostKey;
    if (isHost && keyToUse) {
      startGame(keyToUse);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/multiplayer');
  };

  const copyRoomCode = async () => {
    if (roomCode) {
      try {
        const url = `${window.location.origin}/r/${roomCode}`;
        await navigator.clipboard.writeText(url);
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  if (!connected && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connecting...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-red-500/20 backdrop-blur-md rounded-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connection Error</h2>
          <p className="text-white/80 mb-6">{error?.msg}</p>
          <button
            onClick={() => navigate('/multiplayer')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // If game is running, show the game interface
  if (gameState && gameState.phase === 'playing') {
    const myHand = gameState.yourHand || [];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">
              Room: {roomCode}
            </h1>
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Leave Game
            </button>
          </div>

          {/* Game Table */}
          <GameTable
            topCard={gameState.topCard}
            currentColor={gameState.currentColor}
            drawPileSize={gameState.drawPile.length}
            onDrawCard={() => sendMove({ type: 'draw_card' })}
          />

          {/* Player's Hand */}
          <div className="mt-8">
            <Hand
              cards={myHand}
              isCurrentPlayer={gameState.currentPlayerId === playerId}
              onCardSelect={(cardId) => {
                const card = myHand.find(c => c.id === cardId);
                if (card) {
                  sendMove({ type: 'play_card', cardId });
                }
              }}
            />
          </div>

          {/* Game Actions */}
          {gameState.currentPlayerId === playerId && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => sendMove({ type: 'draw_card' })}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg mr-4"
              >
                Draw Card
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Lobby view - waiting for players and game start
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Room {roomCode}</h1>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={copyRoomCode}
              className="text-blue-300 hover:text-blue-200 underline"
            >
              Copy Invite Link
            </button>
            {showCopySuccess && (
              <span className="text-green-300 text-sm">Copied!</span>
            )}
          </div>
        </div>

        {/* Players List */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Players ({seats?.filter(seat => seat.connected).length || 0}/8)
          </h2>
          <div className="space-y-2">
            {seats?.map((seat, index) => (
              <div
                key={seat.playerId}
                className={`flex items-center p-3 rounded-lg ${
                  seat.connected 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-red-500/20 border border-red-500/30'
                }`}
              >
                <div className="flex items-center flex-1">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    seat.connected ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-white font-medium">
                    {seat.playerName}
                    {seat.playerId === playerId && ' (You)'}
                    {index === 0 && ' 👑'}
                  </span>
                </div>
                <span className="text-white/60 text-sm">
                  {seat.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            )) || (
              <div className="text-white/60 text-center py-8">
                Waiting for players to join...
              </div>
            )}
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex gap-4">
          {isHost && seats && seats.filter(seat => seat.connected).length >= 2 && (urlHostKey || hostKey) && (
            <button
              onClick={handleStartGame}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
            >
              Start Game
            </button>
          )}
          
          <button
            onClick={handleLeaveRoom}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Leave Room
          </button>
        </div>

        {/* Waiting message */}
        {(!isHost || (seats && seats.filter(seat => seat.connected).length < 2)) && (
          <div className="text-center mt-6 text-white/60">
            {seats && seats.filter(seat => seat.connected).length < 2
              ? 'Waiting for more players to join (minimum 2 players)'
              : 'Waiting for host to start the game...'}
          </div>
        )}
      </div>
    </div>
  );
};
