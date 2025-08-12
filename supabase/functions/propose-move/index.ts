import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

// Type definitions (simplified - in a real app, import from shared types)
interface ProposeMove {
  roomId: string;
  playerId: string;
  move: {
    type: 'play_card' | 'draw_card' | 'call_uno';
    cardId?: string;
    chosenColor?: string;
  };
}

interface GameState {
  phase: string;
  players: Array<{
    id: string;
    name: string;
    handSize: number;
    isBot: boolean;
  }>;
  currentPlayerId: string;
  topCard: any;
  currentColor: string;
  drawPileSize: number;
  playerHands: Record<string, any[]>;
  // ... other game state properties
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request body
    const { roomId, playerId, move }: ProposeMove = await req.json()

    if (!roomId || !playerId || !move) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify player is in the room
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .eq('room_id', roomId)
      .single()

    if (playerError || !player) {
      return new Response(
        JSON.stringify({ error: 'Player not found in room' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get current game state (from latest snapshot + subsequent events)
    const gameState = await getCurrentGameState(supabase, roomId)
    
    if (!gameState) {
      return new Response(
        JSON.stringify({ error: 'Game state not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate it's the player's turn
    if (gameState.currentPlayerId !== playerId) {
      return new Response(
        JSON.stringify({ error: 'Not your turn' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // TODO: Import and use the actual game engine here
    // For now, this is a simplified validation
    const isValidMove = validateMove(gameState, playerId, move)
    
    if (!isValidMove) {
      return new Response(
        JSON.stringify({ error: 'Invalid move' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Apply move and get new state
    const newGameState = applyMoveToState(gameState, playerId, move)

    // Save event to database
    const { error: eventError } = await supabase
      .from('events')
      .insert({
        room_id: roomId,
        player_id: playerId,
        type: move.type === 'play_card' ? 'card_played' : 'card_drawn',
        payload: {
          move,
          resultingState: {
            currentPlayerId: newGameState.currentPlayerId,
            topCard: newGameState.topCard,
            currentColor: newGameState.currentColor,
            phase: newGameState.phase,
          }
        }
      })

    if (eventError) {
      throw new Error(`Database error: ${eventError.message}`)
    }

    // Create snapshot periodically for performance
    await maybeCreateSnapshot(supabase, roomId, newGameState)

    // Broadcast to room via Realtime
    await supabase
      .channel(`room:${roomId}`)
      .send({
        type: 'broadcast',
        event: 'move_applied',
        payload: {
          playerId,
          move,
          newState: createPublicState(newGameState, playerId),
        }
      })

    // Send personalized responses to each player
    for (const player of newGameState.players) {
      const personalizedState = createPersonalizedState(newGameState, player.id)
      
      await supabase
        .channel(`player:${player.id}`)
        .send({
          type: 'broadcast',
          event: 'state_update',
          payload: personalizedState
        })
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        newState: createPersonalizedState(newGameState, playerId)
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error processing move:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper functions

async function getCurrentGameState(supabase: any, roomId: string): Promise<GameState | null> {
  // Get latest snapshot
  const { data: snapshot } = await supabase
    .from('snapshots')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let gameState: GameState
  let lastEventSequence = 0

  if (snapshot) {
    gameState = snapshot.state
    lastEventSequence = snapshot.event_sequence
  } else {
    // No snapshot, need to reconstruct from all events
    // This is simplified - in a real app, you'd have an initial game state
    return null
  }

  // Get events after the snapshot
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('room_id', roomId)
    .gt('sequence_number', lastEventSequence)
    .order('sequence_number', { ascending: true })

  // Apply events to get current state
  if (events) {
    for (const event of events) {
      gameState = applyEventToState(gameState, event)
    }
  }

  return gameState
}

function validateMove(gameState: GameState, playerId: string, move: any): boolean {
  // TODO: Use actual game engine validation
  // This is a simplified version
  if (gameState.phase !== 'playing') return false
  if (gameState.currentPlayerId !== playerId) return false
  
  return true // Simplified validation
}

function applyMoveToState(gameState: GameState, playerId: string, move: any): GameState {
  // TODO: Use actual game engine to apply move
  // This is a simplified version that just advances the turn
  const newState = { ...gameState }
  
  // Find next player
  const currentPlayerIndex = newState.players.findIndex(p => p.id === playerId)
  const nextPlayerIndex = (currentPlayerIndex + 1) % newState.players.length
  newState.currentPlayerId = newState.players[nextPlayerIndex].id
  
  return newState
}

function applyEventToState(gameState: GameState, event: any): GameState {
  // TODO: Implement event application logic
  return gameState
}

async function maybeCreateSnapshot(supabase: any, roomId: string, gameState: GameState) {
  // Create snapshot every 10 moves or when game ends
  const { count } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId)

  if (count && count % 10 === 0) {
    await supabase
      .from('snapshots')
      .insert({
        room_id: roomId,
        event_sequence: count,
        state: gameState
      })
  }
}

function createPublicState(gameState: GameState, excludePlayerId?: string): any {
  // Remove private information (hands)
  return {
    ...gameState,
    playerHands: Object.keys(gameState.playerHands).reduce((acc, playerId) => {
      acc[playerId] = { size: gameState.playerHands[playerId].length }
      return acc
    }, {} as Record<string, { size: number }>)
  }
}

function createPersonalizedState(gameState: GameState, playerId: string): any {
  const publicState = createPublicState(gameState)
  
  // Add player's own hand
  return {
    ...publicState,
    playerHands: {
      ...publicState.playerHands,
      [playerId]: {
        cards: gameState.playerHands[playerId] || [],
        size: gameState.playerHands[playerId]?.length || 0
      }
    }
  }
}
