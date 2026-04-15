import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with project URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addAcceptedAircraftCodesColumn() {
  console.log('Adding accepted_aircraft_codes column to stands table...')
  
  try {
    // Add the column as TEXT (Supabase will handle JSON array as text)
    const { error } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE stands ADD COLUMN IF NOT EXISTS accepted_aircraft_codes TEXT[] DEFAULT ARRAY[]::TEXT[]'
    })
    
    if (error) {
      console.log('RPC approach failed, trying direct SQL...')
      
      // Alternative: Use raw SQL query via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          sql: 'ALTER TABLE stands ADD COLUMN IF NOT EXISTS accepted_aircraft_codes TEXT[] DEFAULT ARRAY[]::TEXT[]'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error adding column:', errorData)
        
        // Check if column already exists
        if (errorData.message && errorData.message.includes('already exists')) {
          console.log('Column already exists!')
        } else {
          throw errorData
        }
      }
    }
    
    console.log('Column added successfully!')
  } catch (error) {
    console.error('Error:', error)
  }
}

addAcceptedAircraftCodesColumn()