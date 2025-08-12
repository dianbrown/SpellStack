import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GameState, 
  createGame, 
  legalMoves, 
  applyMove, 
  chooseAIMove, 
  isTerminal,
  CardColor,
  AIDifficulty
} from '@uno-game/engine';
import { Hand } from '../components/Hand';
import { useSound } from '../contexts/SoundContext-simple';

const SoloGamePage: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiRetryCount, setAiRetryCount] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<{ cardIndex: number } | null>(null);
  const { playSound } = useSound();

  // Initialize game
  const startNewGame = () => {
    const newGame = createGame({
      seed: Date.now().toString(),
      players: [
        { id: 'human', name: 'You', isBot: false },
        { id: 'ai1', name: 'Bot Alice', isBot: true },
        { id: 'ai2', name: 'Bot Bob', isBot: true },
        { id: 'ai3', name: 'Bot Charlie', isBot: true }
      ]
    });
    setGameState(newGame);
    setSelectedCardId(null);
    setShowColorPicker(false);
    setPendingWildCard(null);
    setAiRetryCount(0);
  };

  // Handle AI turns
  useEffect(() => {
    if (!gameState || isTerminal(gameState) || isProcessingAI) return;

    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    if (currentPlayer && currentPlayer.isBot) {
      setIsProcessingAI(true);
      
      // Add a small delay to make AI moves visible
      const timeoutId = setTimeout(() => {
        // Double-check state hasn't changed during timeout
        if (!gameState || isTerminal(gameState)) {
          setIsProcessingAI(false);
          setAiRetryCount(0);
          return;
        }
        
        const aiMove = chooseAIMove(gameState, currentPlayer.id, AIDifficulty.Medium);
        if (aiMove) {
          try {
            const newState = applyMove(gameState, aiMove);
            setGameState(newState);
            setAiRetryCount(0); // Reset retry count on success
            playSound('cardPlay');
          } catch (error) {
            console.error('Error applying AI move:', error);
            // If AI fails repeatedly, force a draw card move
            if (aiRetryCount >= 3) {
              try {
                const drawMove = { type: 'draw_card' as const };
                const newState = applyMove(gameState, drawMove);
                setGameState(newState);
                setAiRetryCount(0);
                console.warn('AI failed multiple times, forcing draw card');
              } catch (drawError) {
                console.error('Failed to force draw card, game may be stuck:', drawError);
              }
            } else {
              setAiRetryCount(prev => prev + 1);
            }
          }
        } else {
          // No valid move found, try to draw a card
          try {
            const drawMove = { type: 'draw_card' as const };
            const newState = applyMove(gameState, drawMove);
            setGameState(newState);
            setAiRetryCount(0);
          } catch (error) {
            console.error('AI cannot draw card either:', error);
            setAiRetryCount(prev => prev + 1);
          }
        }
        setIsProcessingAI(false);
      }, 1000);

      // Cleanup function to prevent multiple timeouts
      return () => {
        clearTimeout(timeoutId);
        setIsProcessingAI(false);
      };
    } else {
      // Reset retry count when it's human turn
      setAiRetryCount(0);
    }
  }, [gameState, playSound, aiRetryCount]); // Added aiRetryCount to dependencies

  const handleCardClick = (cardId: string) => {
    if (!gameState || isTerminal(gameState)) return;

    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    if (!currentPlayer || currentPlayer.id !== 'human') return;

    const playerHand = gameState.playerHands[currentPlayer.id];
    const card = playerHand.find(c => c.id === cardId);
    if (!card) return;
    
    // If it's a wild card, show color picker
    if (card.color === 'wild') {
      setPendingWildCard({ cardIndex: playerHand.findIndex(c => c.id === cardId) });
      setShowColorPicker(true);
      return;
    }

    // Try to play the card
    const move = {
      type: 'play_card' as const,
      cardId: card.id
    };

    const legal = legalMoves(gameState, 'human');
    const isLegal = legal.some(m => 
      m.type === 'play_card' && 
      m.cardId === cardId
    );

    if (isLegal) {
      const newState = applyMove(gameState, move);
      setGameState(newState);
      playSound('cardPlay');
      setSelectedCardId(null);
    } else {
      playSound('buttonClick'); // Error sound
    }
  };

  const handleColorChoice = (color: 'red' | 'green' | 'blue' | 'yellow') => {
    if (!gameState || !pendingWildCard) return;

    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    if (!currentPlayer) return;
    
    const playerHand = gameState.playerHands[currentPlayer.id];
    const card = playerHand[pendingWildCard.cardIndex];

    const move = {
      type: 'play_card' as const,
      cardId: card.id,
      chosenColor: color as CardColor
    };

    const newState = applyMove(gameState, move);
    setGameState(newState);
    playSound('cardPlay');
    
    setShowColorPicker(false);
    setPendingWildCard(null);
    setSelectedCardId(null);
  };

  const handleDrawCard = () => {
    if (!gameState || isTerminal(gameState)) return;

    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    if (!currentPlayer || currentPlayer.id !== 'human') return;

    const move = {
      type: 'draw_card' as const
    };

    const newState = applyMove(gameState, move);
    setGameState(newState);
    playSound('cardDraw');
  };

  // Game setup screen
  if (!gameState) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Solo Game</h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-6xl mb-6">🎮</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Play?</h2>
            <p className="text-gray-600 mb-8">
              Challenge 3 AI opponents in a classic game of UNO. 
              First to empty your hand wins!
            </p>
            <button
              onClick={startNewGame}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
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

  const humanPlayer = gameState.players.find(p => p.id === 'human');
  const humanHand = humanPlayer ? gameState.playerHands[humanPlayer.id] : [];
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
  const isHumanTurn = currentPlayer?.id === 'human';
  const gameEnded = isTerminal(gameState);
  
  // Get legal moves for highlighting playable cards
  const legal = gameState && isHumanTurn ? legalMoves(gameState, 'human') : [];
  const playableCardIds = legal
    .filter(move => move.type === 'play_card')
    .map(move => move.cardId)
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">UNO Solo</h1>
          <div className="flex gap-4">
            <button
              onClick={startNewGame}
              className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              New Game
            </button>
            <Link
              to="/"
              className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors"
            >
              Home
            </Link>
          </div>
        </div>

        {/* Game Status */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center text-white">
            <div>
              {gameEnded ? (
                <span className="text-xl font-bold">Game Over!</span>
              ) : (
                <span className="text-lg">
                  {isHumanTurn ? "Your turn" : `${currentPlayer?.name || 'Unknown'}'s turn`}
                  {isProcessingAI && " (thinking...)"}
                </span>
              )}
            </div>
            <div className="text-sm">
              Direction: {gameState.direction === 'clockwise' ? "↻" : "↺"}
            </div>
          </div>
        </div>

        {/* Game Table */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-8">
            {/* Draw Pile */}
            <div className="text-center">
              <div className="w-24 h-36 bg-blue-800 rounded-lg border-2 border-white shadow-lg flex items-center justify-center mb-2">
                <span className="text-white font-bold text-lg">{gameState.drawPile.length}</span>
              </div>
              <div className="text-white text-sm">Draw Pile</div>
            </div>

            {/* Discard Pile */}
            <div className="text-center">
              {gameState.topCard ? (
                <div className="mb-2">
                  <div className={`w-24 h-36 rounded-lg border-2 border-white shadow-lg flex items-center justify-center text-white font-bold ${
                    gameState.topCard.color === 'red' ? 'bg-red-500' :
                    gameState.topCard.color === 'green' ? 'bg-green-500' :
                    gameState.topCard.color === 'blue' ? 'bg-blue-500' :
                    gameState.topCard.color === 'yellow' ? 'bg-yellow-500' :
                    'bg-gray-800'
                  }`}>
                    {gameState.topCard.type === 'number' ? gameState.topCard.value :
                     gameState.topCard.type === 'skip' ? 'Skip' :
                     gameState.topCard.type === 'reverse' ? 'Rev' :
                     gameState.topCard.type === 'draw_two' ? '+2' :
                     gameState.topCard.type === 'wild' ? 'Wild' :
                     gameState.topCard.type === 'wild_draw_four' ? '+4' : '?'}
                  </div>
                </div>
              ) : (
                <div className="w-24 h-36 bg-gray-400 rounded-lg border-2 border-white shadow-lg mb-2"></div>
              )}
              <div className="text-white text-sm">Discard Pile</div>
            </div>

            {/* Current Color Indicator */}
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full border-4 border-white shadow-lg mb-2 ${
                gameState.currentColor === 'red' ? 'bg-red-500' :
                gameState.currentColor === 'green' ? 'bg-green-500' :
                gameState.currentColor === 'blue' ? 'bg-blue-500' :
                gameState.currentColor === 'yellow' ? 'bg-yellow-500' :
                'bg-gray-500'
              }`}></div>
              <div className="text-white text-sm">Current Color</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isHumanTurn && !gameEnded && (
          <div className="flex justify-center mb-6">
            <button
              onClick={handleDrawCard}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Draw Card
            </button>
          </div>
        )}

        {/* Human Hand */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <h3 className="text-white text-lg font-semibold mb-3">Your Hand ({humanHand.length} cards)</h3>
          <Hand
            cards={humanHand}
            playableCards={playableCardIds}
            selectedCard={selectedCardId || undefined}
            onCardSelect={handleCardClick}
            isCurrentPlayer={isHumanTurn}
          />
        </div>

        {/* Other Players Info */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {gameState.players.filter(p => p.id !== 'human').map((player) => (
            <div key={player.id} className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-white">
                <div className="font-semibold">{player.name}</div>
                <div className="text-sm opacity-80">
                  {player.handSize} cards
                </div>
                {currentPlayer?.id === player.id && (
                  <div className="text-xs bg-yellow-400 text-black px-2 py-1 rounded mt-1 inline-block">
                    Current turn
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Color Picker Modal */}
        {showColorPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-center">Choose a color:</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => handleColorChoice('red')}
                  className="w-16 h-16 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                />
                <button
                  onClick={() => handleColorChoice('green')}
                  className="w-16 h-16 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                />
                <button
                  onClick={() => handleColorChoice('blue')}
                  className="w-16 h-16 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                />
                <button
                  onClick={() => handleColorChoice('yellow')}
                  className="w-16 h-16 bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoloGamePage;
