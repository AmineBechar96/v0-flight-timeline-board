-- =====================================================
-- Flight Timeline Board - Complete Historical Schema
-- =====================================================
-- Run this in your Supabase SQL Editor to create:
-- 1. history_flight_time table
-- 2. history_allocation table
-- 3. Views for scheduled/actual times
-- =====================================================

-- =====================================================
-- Step 1: Drop existing tables (optional - for clean install)
-- Uncomment the following lines if you want to start fresh
-- =====================================================
-- DROP TABLE IF EXISTS history_allocation CASCADE;
-- DROP TABLE IF EXISTS history_flight_time CASCADE;

-- =====================================================
-- Step 2: Create history_flight_time table
-- =====================================================
-- Each flight has 2 rows: delay_type=0 (scheduled), delay_type=1 (actual)
CREATE TABLE IF NOT EXISTS history_flight_time (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_num TEXT NOT NULL REFERENCES flights(flight_num) ON DELETE CASCADE,
  arr_time TIMESTAMPTZ NOT NULL,
  dep_time TIMESTAMPTZ NOT NULL,
  delay_type INTEGER NOT NULL CHECK (delay_type IN (0, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flight_num, delay_type)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_history_flight_time_flight_num ON history_flight_time(flight_num);
CREATE INDEX IF NOT EXISTS idx_history_flight_time_delay_type ON history_flight_time(delay_type);
CREATE INDEX IF NOT EXISTS idx_history_flight_time_arr_time ON history_flight_time(arr_time);
CREATE INDEX IF NOT EXISTS idx_history_flight_time_dep_time ON history_flight_time(dep_time);

-- =====================================================
-- Step 3: Create history_allocation table
-- =====================================================
-- Each allocation has 2 rows: delay_type=0 (scheduled), delay_type=1 (actual)
CREATE TABLE IF NOT EXISTS history_allocation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_num TEXT NOT NULL REFERENCES flights(flight_num) ON DELETE CASCADE,
  stand_id TEXT NOT NULL,
  delay_type INTEGER NOT NULL CHECK (delay_type IN (0, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flight_num, stand_id, delay_type)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_history_allocation_flight_num ON history_allocation(flight_num);
CREATE INDEX IF NOT EXISTS idx_history_allocation_stand_id ON history_allocation(stand_id);
CREATE INDEX IF NOT EXISTS idx_history_allocation_delay_type ON history_allocation(delay_type);

-- =====================================================
-- Step 4: Create Views for convenience
-- =====================================================

-- View for getting scheduled times (delay_type=0)
CREATE OR REPLACE VIEW flight_scheduled_times AS
SELECT 
  hft.flight_num,
  hft.arr_time AS scheduled_arr_time,
  hft.dep_time AS scheduled_dep_time
FROM history_flight_time hft
WHERE hft.delay_type = 0;

-- View for getting actual times (delay_type=1)
CREATE OR REPLACE VIEW flight_actual_times AS
SELECT 
  hft.flight_num,
  hft.arr_time AS actual_arr_time,
  hft.dep_time AS actual_dep_time
FROM history_flight_time hft
WHERE hft.delay_type = 1;

-- Combined view with both scheduled and actual times
CREATE OR REPLACE VIEW flight_all_times AS
SELECT 
  f.flight_num,
  f.airline,
  f.aircraft_type,
  f.origin,
  f.destination,
  sched.arr_time AS scheduled_arr_time,
  sched.dep_time AS scheduled_dep_time,
  actual.arr_time AS actual_arr_time,
  actual.dep_time AS actual_dep_time,
  alloc_sched.stand_id AS scheduled_stand,
  alloc_actual.stand_id AS actual_stand
FROM flights f
LEFT JOIN history_flight_time sched ON f.flight_num = sched.flight_num AND sched.delay_type = 0
LEFT JOIN history_flight_time actual ON f.flight_num = actual.flight_num AND actual.delay_type = 1
LEFT JOIN history_allocation alloc_sched ON f.flight_num = alloc_sched.flight_num AND alloc_sched.delay_type = 0
LEFT JOIN history_allocation alloc_actual ON f.flight_num = alloc_actual.flight_num AND alloc_actual.delay_type = 1;

-- =====================================================
-- Step 5: Enable RLS (Row Level Security)
-- =====================================================
ALTER TABLE history_flight_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_allocation ENABLE ROW LEVEL SECURITY;

-- Allow anon key to read history tables
CREATE POLICY "Allow reading history_flight_time" ON history_flight_time FOR SELECT TO anon USING (true);
CREATE POLICY "Allow reading history_allocation" ON history_allocation FOR SELECT TO anon USING (true);

-- Allow anon key to insert
CREATE POLICY "Allow inserting history_flight_time" ON history_flight_time FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow inserting history_allocation" ON history_allocation FOR INSERT TO anon WITH CHECK (true);

-- Allow anon key to update
CREATE POLICY "Allow updating history_flight_time" ON history_flight_time FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow updating history_allocation" ON history_allocation FOR UPDATE TO anon USING (true);

-- =====================================================
-- Step 6: Useful queries for your frontend
-- =====================================================

-- Get all flights for a specific day (scheduled times only)
-- Replace '2025-07-01' with your target date
-- SELECT * FROM history_flight_time hft
-- WHERE hft.delay_type = 0
-- AND DATE(hft.arr_time) = '2025-07-01';

-- Get flights with their stand allocations for a day
-- SELECT 
--   hft.flight_num,
--   hft.arr_time AS scheduled_arr,
--   hft.dep_time AS scheduled_dep,
--   ha.stand_id
-- FROM history_flight_time hft
-- JOIN history_allocation ha ON hft.flight_num = ha.flight_num AND hft.delay_type = ha.delay_type
-- WHERE hft.delay_type = 0
-- AND DATE(hft.arr_time) = '2025-07-01';

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE history_flight_time IS 'Stores historical flight times. Each flight has 2 rows: delay_type=0 (scheduled STA/STD), delay_type=1 (actual CHOXON/CHOXOFF)';
COMMENT ON TABLE history_allocation IS 'Stores historical stand allocations. Each allocation has 2 rows: delay_type=0 (scheduled), delay_type=1 (actual)';
COMMENT ON COLUMN history_flight_time.delay_type IS '0 = scheduled time (STA/STD), 1 = actual time (CHOXON/CHOXOFF)';
COMMENT ON COLUMN history_allocation.delay_type IS '0 = scheduled allocation, 1 = actual allocation';

-- =====================================================
-- Done! The tables and views are now created.
-- Next: Run the import_flights_to_history.mjs script to load CSV data
-- =====================================================
