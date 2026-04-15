-- =====================================================
-- Flight Timeline Board - Complete Database Clone
-- =====================================================
-- Run this in your Supabase SQL Editor to clone the database
-- =====================================================

-- =====================================================
-- STEP 1: Create Tables
-- =====================================================

-- Zones table
CREATE TABLE IF NOT EXISTS zones (
  id TEXT PRIMARY KEY,
  description TEXT
);

-- Codes table
CREATE TABLE IF NOT EXISTS codes (
  id TEXT PRIMARY KEY
);

-- Stands table
CREATE TABLE IF NOT EXISTS stands (
  id TEXT PRIMARY KEY,
  zone TEXT,
  code TEXT,
  is_closed BOOLEAN DEFAULT false
);

-- Airlines table
CREATE TABLE IF NOT EXISTS airlines (
  iata_code TEXT PRIMARY KEY,
  full_name TEXT,
  is_aa_group BOOLEAN DEFAULT false,
  icao_code TEXT
);

-- Code aircraft types mapping
CREATE TABLE IF NOT EXISTS code_aircraft_types (
  code_id TEXT,
  aircraft_type TEXT
);

-- Flights table
CREATE TABLE IF NOT EXISTS flights (
  flight_num TEXT PRIMARY KEY,
  reg_no TEXT,
  aircraft_type TEXT,
  airline TEXT,
  origin TEXT,
  destination TEXT,
  load_type TEXT,
  pax_in INTEGER DEFAULT 0,
  pax_out INTEGER DEFAULT 0,
  arr_time TIMESTAMPTZ,
  dep_time TIMESTAMPTZ,
  connection_type TEXT,
  is_cancelled BOOLEAN DEFAULT false,
  is_delayed BOOLEAN DEFAULT false
);

-- Allocations table
CREATE TABLE IF NOT EXISTS allocations (
  flight_num TEXT REFERENCES flights(flight_num) ON DELETE CASCADE,
  stand_id TEXT
);

-- History flight time table (NEW)
CREATE TABLE IF NOT EXISTS history_flight_time (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_num TEXT NOT NULL REFERENCES flights(flight_num) ON DELETE CASCADE,
  arr_time TIMESTAMPTZ NOT NULL,
  dep_time TIMESTAMPTZ NOT NULL,
  delay_type INTEGER NOT NULL CHECK (delay_type IN (0, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flight_num, delay_type)
);

-- History allocation table (NEW)
CREATE TABLE IF NOT EXISTS history_allocation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_num TEXT NOT NULL REFERENCES flights(flight_num) ON DELETE CASCADE,
  stand_id TEXT NOT NULL,
  delay_type INTEGER NOT NULL CHECK (delay_type IN (0, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flight_num, stand_id, delay_type)
);

-- =====================================================
-- STEP 2: Insert Zones Data
-- =====================================================
INSERT INTO zones (id, description) VALUES
  ('PBB', 'PBB Stands'),
  ('Z10', 'Zone 10'),
  ('Z11', 'Zone 11'),
  ('Z12', 'Zone 12'),
  ('Z13', 'Zone 13'),
  ('Z14', 'Zone 14'),
  ('Z15', 'Zone 15')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 3: Insert Codes Data
-- =====================================================
INSERT INTO codes (id) VALUES
  ('C'),
  ('D'),
  ('E'),
  ('F')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 4: Insert Stands Data
-- =====================================================
INSERT INTO stands (id, zone, code, is_closed) VALUES
  ('2', 'PBB', 'E', false),
  ('3', 'PBB', 'E', false),
  ('4', 'PBB', 'D', false),
  ('5', 'PBB', 'E', false),
  ('6', 'PBB', 'D', false),
  ('7', 'PBB', 'E', false),
  ('8', 'PBB', 'C', false),
  ('9', 'Z10', 'C', true),
  ('13', 'Z10', 'C', true),
  ('14', 'Z10', 'C', false),
  ('15', 'Z10', 'C', false),
  ('16', 'Z10', 'C', false),
  ('17', 'Z11', 'C', false),
  ('18', 'Z11', 'C', false),
  ('19', 'Z11', 'C', false),
  ('20', 'Z11', 'C', false),
  ('21', 'Z11', 'C', false),
  ('22', 'Z12', 'D', false),
  ('23', 'Z12', 'D', false),
  ('24', 'Z12', 'D', false),
  ('25', 'Z12', 'D', false),
  ('26', 'Z12', 'D', false),
  ('27', 'Z13', 'E', false),
  ('28', 'Z13', 'E', false),
  ('29', 'Z13', 'E', false),
  ('30', 'Z13', 'E', false),
  ('31', 'Z13', 'E', false),
  ('32', 'Z14', 'E', false),
  ('33', 'Z14', 'E', false),
  ('34', 'Z14', 'E', false),
  ('35', 'Z14', 'E', false),
  ('36', 'Z14', 'E', false),
  ('37', 'Z15', 'F', false),
  ('38', 'Z15', 'F', false),
  ('39', 'Z15', 'F', false),
  ('40', 'Z15', 'F', false),
  ('41', 'Z15', 'F', false),
  ('42', 'Z15', 'F', false),
  ('43', 'Z15', 'F', false),
  ('44', 'Z15', 'F', false),
  ('45', 'Z15', 'F', false),
  ('46', 'Z15', 'F', false),
  ('47', 'Z15', 'F', false),
  ('48', 'Z15', 'F', false),
  ('49', 'Z15', 'F', false),
  ('50', 'Z15', 'F', false),
  ('51', 'Z15', 'F', false),
  ('52', 'Z15', 'F', false),
  ('53', 'Z15', 'F', false),
  ('54', 'Z15', 'F', false),
  ('55', 'Z15', 'F', false),
  ('56', 'Z15', 'F', false),
  ('57', 'Z15', 'F', false),
  ('58', 'Z15', 'F', false),
  ('59', 'Z15', 'F', false),
  ('60', 'Z15', 'F', false),
  ('61', 'Z15', 'F', false),
  ('62', 'Z15', 'F', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 5: Insert Airlines Data
-- =====================================================
INSERT INTO airlines (iata_code, full_name, is_aa_group, icao_code) VALUES
  ('G9', 'Air Arabia', false, 'ABY'),
  ('3L', 'Air Arabia Egypt', false, 'EGY'),
  ('3O', 'Air Arabia Maroc', false, 'MAC'),
  ('E5', 'Air Arabia Tchad', false, 'CHE'),
  ('9P', 'Air Arabia Jordan', false, 'JRD'),
  ('QTR', 'Qatar Airways', false, 'QTR'),
  ('SIA', 'Singapore Airlines', false, 'SIA'),
  ('ETH', 'Ethiopian Airlines', false, 'ETH'),
  ('IGO', 'IndiGo', false, 'IGO'),
  ('AXB', 'Air India Express', true, 'AXB'),
  ('KQA', 'Kenya Airways', false, 'KQA'),
  ('MSR', 'EgyptAir', false, 'MSR'),
  ('MSC', 'Air Cairo', false, 'MSC'),
  ('PGT', 'Pegasus Airlines', false, 'PGT'),
  ('PIA', 'Pakistan International Airlines', false, 'PIA'),
  ('SVA', 'Saudi Arabian Airlines', false, 'SVA'),
  ('SYR', 'Syrian Air', false, 'SYR'),
  ('UPS', 'UPS Airlines', false, 'UPS'),
  ('GTI', 'Atlas Air', false, 'GTI')
ON CONFLICT (iata_code) DO NOTHING;

-- =====================================================
-- STEP 6: Insert Code Aircraft Types Mapping
-- =====================================================
INSERT INTO code_aircraft_types (code_id, aircraft_type) VALUES
  ('C', 'A320'),
  ('C', 'A319'),
  ('C', 'B737'),
  ('C', 'B738'),
  ('C', 'B739'),
  ('C', 'E190'),
  ('C', 'E195'),
  ('C', 'A20N'),
  ('D', 'A321'),
  ('D', 'A322'),
  ('D', 'B752'),
  ('D', 'B763'),
  ('D', 'B772'),
  ('D', 'A30B'),
  ('D', 'A339'),
  ('D', 'A359'),
  ('D', 'B39M'),
  ('E', 'A333'),
  ('E', 'A332'),
  ('E', 'B77W'),
  ('E', 'B788'),
  ('E', 'B789'),
  ('E', 'A338'),
  ('F', 'A380'),
  ('F', 'B744'),
  ('F', 'B748'),
  ('F', 'B74F'),
  ('F', 'A385'),
  ('F', 'A388')
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 7: Insert Flights Data
-- =====================================================
INSERT INTO flights (flight_num, reg_no, aircraft_type, airline, origin, destination, load_type, pax_in, pax_out, arr_time, dep_time, connection_type, is_cancelled, is_delayed) VALUES
  ('AXB745', 'VT-AXR', 'A20N', 'AXB', 'CCJ', 'CCJ', 'Pax', 188, 175, '2026-02-19T10:15:00', '2026-02-19T13:46:00', 'normal', false, false),
  ('AXB746', 'VT-AXS', 'A20N', 'AXB', 'CCJ', 'CCJ', 'Cgo', 0, 0, '2026-02-19T10:15:00', '2026-02-19T13:46:00', 'normal', false, false),
  ('G9501', 'A6-AQH', 'A380', 'G9', 'BAH', 'BAH', 'Pax', 165, 170, '2026-02-19T16:50:00', '2026-02-19T18:45:00', 'no_connection', false, false),
  ('G9337', 'A6-ABM', 'A306', 'G9', 'AMM', 'AMM', 'Pax', 134, 140, '2026-02-19T14:00:00', '2026-02-19T16:51:00', 'critical', false, true)
ON CONFLICT (flight_num) DO NOTHING;

-- =====================================================
-- STEP 8: Insert Allocations Data
-- =====================================================
INSERT INTO allocations (flight_num, stand_id) VALUES
  ('G9337', '3'),
  ('AXB745', '39'),
  ('G9501', '50'),
  ('AXB746', '56')
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 9: Create Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_stands_zone ON stands(zone);
CREATE INDEX IF NOT EXISTS idx_stands_code ON stands(code);
CREATE INDEX IF NOT EXISTS idx_flights_airline ON flights(airline);
CREATE INDEX IF NOT EXISTS idx_flights_arr_time ON flights(arr_time);
CREATE INDEX IF NOT EXISTS idx_flights_dep_time ON flights(dep_time);
CREATE INDEX IF NOT EXISTS idx_allocations_flight_num ON allocations(flight_num);
CREATE INDEX IF NOT EXISTS idx_allocations_stand_id ON allocations(stand_id);
CREATE INDEX IF NOT EXISTS idx_code_aircraft_types_code_id ON code_aircraft_types(code_id);
CREATE INDEX IF NOT EXISTS idx_code_aircraft_types_aircraft_type ON code_aircraft_types(aircraft_type);

-- History tables indexes
CREATE INDEX IF NOT EXISTS idx_history_flight_time_flight_num ON history_flight_time(flight_num);
CREATE INDEX IF NOT EXISTS idx_history_flight_time_delay_type ON history_flight_time(delay_type);
CREATE INDEX IF NOT EXISTS idx_history_allocation_flight_num ON history_allocation(flight_num);
CREATE INDEX IF NOT EXISTS idx_history_allocation_delay_type ON history_allocation(delay_type);

-- =====================================================
-- STEP 10: Enable RLS
-- =====================================================
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stands ENABLE ROW LEVEL SECURITY;
ALTER TABLE airlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_aircraft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_flight_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_allocation ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anon access
CREATE POLICY "Allow zones read" ON zones FOR SELECT TO anon USING (true);
CREATE POLICY "Allow codes read" ON codes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow stands read" ON stands FOR SELECT TO anon USING (true);
CREATE POLICY "Allow airlines read" ON airlines FOR SELECT TO anon USING (true);
CREATE POLICY "Allow code_aircraft_types read" ON code_aircraft_types FOR SELECT TO anon USING (true);
CREATE POLICY "Allow flights read" ON flights FOR SELECT TO anon USING (true);
CREATE POLICY "Allow flights insert" ON flights FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow flights update" ON flights FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow allocations read" ON allocations FOR SELECT TO anon USING (true);
CREATE POLICY "Allow allocations insert" ON allocations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow allocations update" ON allocations FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow history_flight_time read" ON history_flight_time FOR SELECT TO anon USING (true);
CREATE POLICY "Allow history_flight_time insert" ON history_flight_time FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow history_allocation read" ON history_allocation FOR SELECT TO anon USING (true);
CREATE POLICY "Allow history_allocation insert" ON history_allocation FOR INSERT TO anon WITH CHECK (true);

-- =====================================================
-- STEP 11: Views
-- =====================================================
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
-- ✅ DONE! Database is cloned.
-- =====================================================
