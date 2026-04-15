import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://lnbqvczlwxceqarafmiy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYnF2Y3psd3hjZXFhcmFmbWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU5ODAsImV4cCI6MjA5MTIzMTk4MH0.9PzC2a8unN7NiN_gFyNdg1wgUCXHdMqJxvDlgmvsU7M'
)

async function check() {
  console.log('🔍 Checking if history tables exist...\n')
  
  // Check history_flight_time
  const { data: historyFlights, error: err1 } = await supabase
    .from('history_flight_time')
    .select('*')
    .limit(5)
  
  if (err1) {
    console.log('❌ history_flight_time table does NOT exist')
    console.log('   Error:', err1.message)
  } else {
    console.log('✅ history_flight_time table exists')
    console.log('   Records:', historyFlights?.length || 0)
    if (historyFlights && historyFlights.length > 0) {
      console.log('   Sample:', JSON.stringify(historyFlights[0], null, 2))
    }
  }
  
  console.log('')
  
  // Check history_allocation
  const { data: historyAlloc, error: err2 } = await supabase
    .from('history_allocation')
    .select('*')
    .limit(5)
  
  if (err2) {
    console.log('❌ history_allocation table does NOT exist')
    console.log('   Error:', err2.message)
  } else {
    console.log('✅ history_allocation table exists')
    console.log('   Records:', historyAlloc?.length || 0)
    if (historyAlloc && historyAlloc.length > 0) {
      console.log('   Sample:', JSON.stringify(historyAlloc[0], null, 2))
    }
  }
}

check().catch(console.error)
