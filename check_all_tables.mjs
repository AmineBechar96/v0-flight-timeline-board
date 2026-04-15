import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lnbqvczlwxceqarafmiy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYnF2Y3psd3hjZXFhcmFmbWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU5ODAsImV4cCI6MjA5MTIzMTk4MH0.9PzC2a8unN7NiN_gFyNdg1wgUCXHdMqJxvDlgmvsU7M'

const supabase = createClient(supabaseUrl, supabaseKey)

async function dumpDatabase() {
  console.log('📦 Dumping entire database schema and data...\n')
  
  const tables = ['flights', 'allocations', 'stands', 'zones', 'codes', 'airlines', 'code_aircraft_types']
  
  for (const table of tables) {
    console.log(`\n📋 Table: ${table}`)
    const { data, error } = await supabase.from(table).select('*')
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`)
    } else {
      console.log(`   ✅ ${data.length} rows`)
      if (data.length > 0) {
        console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`)
      }
    }
  }
  
  // Also check constraints_config
  console.log('\n📋 Table: constraints_config')
  const { data: constraints, error: constraintsError } = await supabase.from('constraints_config').select('*')
  if (constraintsError) {
    console.log(`   ❌ Error: ${constraintsError.message}`)
  } else {
    console.log(`   ✅ ${constraints.length} rows`)
  }
}

dumpDatabase().catch(console.error)
