-- Create custom types
CREATE TYPE room_status AS ENUM ('lobby', 'playing', 'ended');
CREATE TYPE event_type AS ENUM (
  'player_joined', 
  'player_left', 
  'game_started', 
  'card_played', 
  'card_drawn', 
  'color_chosen',
  'uno_called',
  'round_ended',
  'game_ended'
);

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status room_status DEFAULT 'lobby',
  host_id UUID,
  max_players INTEGER DEFAULT 4,
  current_players INTEGER DEFAULT 0,
  game_settings JSONB DEFAULT '{
    "unoCallRequired": false,
    "stackDrawCards": true,
    "timeLimit": 30
  }'::jsonb
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  seat INTEGER, -- 0-3 for seat position
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_host BOOLEAN DEFAULT FALSE,
  is_bot BOOLEAN DEFAULT FALSE,
  UNIQUE(room_id, seat)
);

-- Game events table (append-only log)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type event_type NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sequence_number SERIAL
);

-- Game state snapshots (periodic saves for performance)
CREATE TABLE snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_sequence INTEGER NOT NULL, -- Last event included in this snapshot
  state JSONB NOT NULL
);

-- Indexes for better performance
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_events_room_id ON events(room_id);
CREATE INDEX idx_events_sequence ON events(room_id, sequence_number);
CREATE INDEX idx_snapshots_room_id ON snapshots(room_id);

-- RLS (Row Level Security) policies
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;

-- Room policies - players can only see rooms they're in
CREATE POLICY "Players can view their rooms" ON rooms
  FOR SELECT USING (
    id IN (SELECT room_id FROM players WHERE id = auth.uid())
  );

CREATE POLICY "Anyone can create rooms" ON rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Room hosts can update their rooms" ON rooms
  FOR UPDATE USING (
    host_id = auth.uid() OR 
    id IN (SELECT room_id FROM players WHERE id = auth.uid() AND is_host = true)
  );

-- Player policies
CREATE POLICY "Players can view players in their rooms" ON players
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM players WHERE id = auth.uid())
  );

CREATE POLICY "Players can insert themselves" ON players
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Players can update themselves" ON players
  FOR UPDATE USING (id = auth.uid());

-- Event policies
CREATE POLICY "Players can view events in their rooms" ON events
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM players WHERE id = auth.uid())
  );

CREATE POLICY "Players can insert events in their rooms" ON events
  FOR INSERT WITH CHECK (
    room_id IN (SELECT room_id FROM players WHERE id = auth.uid()) AND
    (player_id = auth.uid() OR player_id IS NULL)
  );

-- Snapshot policies
CREATE POLICY "Players can view snapshots in their rooms" ON snapshots
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM players WHERE id = auth.uid())
  );

-- Only server/edge functions can manage snapshots
CREATE POLICY "Service role can manage snapshots" ON snapshots
  FOR ALL USING (auth.role() = 'service_role');

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to generate unique room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  
  -- Check if code already exists
  WHILE EXISTS (SELECT 1 FROM rooms WHERE code = result) LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old rooms (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete rooms older than 24 hours with no recent activity
  DELETE FROM rooms 
  WHERE updated_at < NOW() - INTERVAL '24 hours'
    AND status = 'ended';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
