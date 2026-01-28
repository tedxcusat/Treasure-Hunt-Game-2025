-- 1. Create Zones Table
CREATE TABLE IF NOT EXISTS zones (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 20,
  unlock_code TEXT NOT NULL,
  clues TEXT[] NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL
);

-- Enable Read Access
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON zones;
CREATE POLICY "Public read access" ON zones FOR SELECT USING (true);

-- 2. Seed Zones (CUSAT Campus Locations)
INSERT INTO zones (id, name, lat, lng, radius_meters, unlock_code, clues, question, options)
VALUES 
(1, 'ADM (Administrative Office)', 10.04304061894997, 76.32450554205566, 25, '1234', ARRAY['Near the main entrance circle', 'Look for the administrative block'], 'What gets wetter as it dries?', '["Towel", "Ocean", "Cloud", "Rain"]'::jsonb),
(2, 'University Library', 10.04466182710918, 76.3250271941694, 25, '5678', ARRAY['Opposite the SMS building', 'Center of knowledge'], 'David''s parents have three sons: Snap, Crackle, and...?', '["David", "Pop", "Chip", "Dale"]'::jsonb),
(3, 'Butterfly Park', 10.043480971912379, 76.32533335184156, 30, '9012', ARRAY['Near the Dept. of Applied Chemistry', 'Nature spot'], 'What has many keys but can''t open a single lock?', '["Piano", "Map", "Chest", "Door"]'::jsonb),
(4, 'SMS (School of Mgmt. Studies)', 10.043320778723304, 76.32738279602225, 25, '3456', ARRAY['Next to the Main Circle', 'Management Block'], 'The more of this there is, the less you see. What is it?', '["Darkness", "Fog", "Light", "Smoke"]'::jsonb),
(5, 'Amenity Centre', 10.042797743518628, 76.32852206718607, 25, '7890', ARRAY['Near the University Road shops', 'Student Center'], 'I follow you all the time and copy your every move, but you can''t touch me or catch me. What am I?', '["Shadow", "Reflection", "Ghost", "Twin"]'::jsonb),
(6, 'CITTIC', 10.041249144581949, 76.32815209602218, 25, '2468', ARRAY['Near Guest House/TBI', 'Innovation Hub'], 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?', '["Echo", "Ghost", "Cloud", "Shadow"]'::jsonb)
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  radius_meters = EXCLUDED.radius_meters,
  unlock_code = EXCLUDED.unlock_code,
  clues = EXCLUDED.clues,
  question = EXCLUDED.question,
  options = EXCLUDED.options;

-- FIX: Enable UPDATE Access for Teams (Member Login)
DROP POLICY IF EXISTS "Enable update for all" ON teams;
CREATE POLICY "Enable update for all" ON teams FOR UPDATE USING (true);

-- FIX: Enable INSERT Access for Registration
DROP POLICY IF EXISTS "Enable insert for all" ON teams;
CREATE POLICY "Enable insert for all" ON teams FOR INSERT WITH CHECK (true);

-- FIX: Enable SELECT Access for Leaderboard
DROP POLICY IF EXISTS "Enable select for all" ON teams;
CREATE POLICY "Enable select for all" ON teams FOR SELECT USING (true);

-- 3. Add unlocked_clues_count column to teams table (for Mission Archive system)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS unlocked_clues_count INTEGER DEFAULT 0;
