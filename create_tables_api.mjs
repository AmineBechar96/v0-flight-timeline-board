import { createClient } from '@supabase/supabase-js'

// Service role key for admin operations
const supabaseUrl = 'https://lnbqvczlwxceqarafmiy.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYnF2Y3psd3hjZXFhcmFmbWl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1NTk4MCwiZXhwIjoyMDkxMjMxOTgwfQ.J9J5T6g_R9N9Q7E8b1W2vY5xZCj4h3k7mN2lO6pX3sU'  // service_role key

// Using service role client for DDL operations
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTables() {
  console.log('🔧 Creating history tables...\n')
  
  // Create history_flight_time table
  console.log('📋 Creating history_flight_time table...')
  const createHistoryFlightTime = await supabase.rpc('exec', {
    query: `
      CREATE TABLE IF NOT EXISTS history_flight_time (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flight_num TEXT NOT NULL,
        arr_time TIMESTAMPTZ NOT NULL,
        dep_time TIMESTAMPTZ NOT NULL,
        delay_type INTEGER NOT NULL CHECK (delay_type IN (0, 1)),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(flight_num, delay_type)
      );
    `
  })
  
  if (createHistoryFlightTime.error) {
    console.log('❌ Error creating history_flight_time:', createHistoryFlightTime.error.message)
    console.log('   Note: You may need to run this SQL manually in Supabase Dashboard\n')
  } else {
    console.log('✅ history_flight_time table created (or already exists)\n')
  }
  
  // Create history_allocation table
  console.log('📋 Creating history_allocation table...')
  const createHistoryAllocation = await supabase.rpc('exec', {
    query: `
      CREATE TABLE IF NOT EXISTS history_allocation (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flight_num TEXT NOT NULL,
        stand_id TEXT NOT NULL,
        delay_type INTEGER NOT NULL CHECK (delay_type IN (0, 1)),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(flight_num, stand_id, delay_type)
      );
    `
  })
  
  if (createHistoryAllocation.error) {
    console.log('❌ Error creating history_allocation:', createHistoryAllocation.error.message)
    console.log('   Note: You may need to run this SQL manually in Supabase Dashboard\n')
  } else {
    console.log('✅ history_allocation table created (or already exists)\n')
  }
  
  console.log('🏁 Done! Check Supabase Dashboard to verify tables were created.')
}

createTables().catch(console.error)
