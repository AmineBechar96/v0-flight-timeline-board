-- =====================================================
-- Flight Timeline Board - Historical Data Schema
-- =====================================================
-- This script creates tables for storing historical flight data
-- with scheduled and actual times (delay_type 0 and 1)
-- =====================================================

-- Drop existing tables if they exist (for clean install)
-- DROP TABLE IF EXISTS history_allocation CASCADE;
-- DROP TABLE IF EXISTS history_flight_time CASCADE;

-- =====================================================
-- history_flight_time table
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

-- =====================================================
-- history_allocation table
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
-- View for getting scheduled times (delay_type=0)
-- =====================================================
CREATE OR REPLACE VIEW flight_scheduled_times AS
SELECT 
  hft.flight_num,
  hft.arr_time AS scheduled_arr_time,
  hft.dep_time AS scheduled_dep_time
FROM history_flight_time hft
WHERE hft.delay_type = 0;

-- =====================================================
-- View for getting actual times (delay_type=1)
-- =====================================================
CREATE OR REPLACE VIEW flight_actual_times AS
SELECT 
  hft.flight_num,
  hft.arr_time AS actual_arr_time,
  hft.dep_time AS actual_dep_time
FROM history_flight_time hft
WHERE hft.delay_type = 1;

-- =====================================================
-- Combined view with both scheduled and actual times
-- =====================================================
CREATE OR REPLACE VIEW flight_all_times AS
SELECT 
  f.flight_num,
  sched.arr_time AS scheduled_arr_time,
  sched.dep_time AS scheduled_dep_time,
  actual.arr_time AS actual_arr_time,
  actual.dep_time AS actual_dep_time
FROM flights f
LEFT JOIN history_flight_time sched ON f.flight_num = sched.flight_num AND sched.delay_type = 0
LEFT JOIN history_flight_time actual ON f.flight_num = actual.flight_num AND actual.delay_type = 1;

-- =====================================================
-- RLS Policies (Row Level Security)
-- =====================================================
ALTER TABLE history_flight_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_allocation ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read history flight time
CREATE POLICY "Allow reading history_flight_time for authenticated users"
ON history_flight_time FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert history flight time
CREATE POLICY "Allow inserting history_flight_time for authenticated users"
ON history_flight_time FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to read history allocation
CREATE POLICY "Allow reading history_allocation for authenticated users"
ON history_allocation FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert history allocation
CREATE POLICY "Allow inserting history_allocation for authenticated users"
ON history_allocation FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE history_flight_time IS 'Stores historical flight times. Each flight has 2 rows: delay_type=0 (scheduled STA/STD), delay_type=1 (actual CHOXON/CHOXOFF)';
COMMENT ON TABLE history_allocation IS 'Stores historical stand allocations. Each allocation has 2 rows: delay_type=0 (scheduled), delay_type=1 (actual)';
COMMENT ON COLUMN history_flight_time.delay_type IS '0 = scheduled time (STA/STD), 1 = actual time (CHOXON/CHOXOFF)';
COMMENT ON COLUMN history_allocation.delay_type IS '0 = scheduled allocation, 1 = actual allocation';
