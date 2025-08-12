-- Insert some test data for development
INSERT INTO rooms (code, host_id, status, max_players, current_players) VALUES
  ('TEST01', gen_random_uuid(), 'lobby', 4, 1),
  ('TEST02', gen_random_uuid(), 'playing', 4, 3),
  ('TEST03', gen_random_uuid(), 'ended', 4, 4);

-- Note: In a real application, you would use actual user IDs from Supabase Auth
-- This is just for testing the schema structure
