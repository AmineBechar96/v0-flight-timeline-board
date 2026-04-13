import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lnbqvczlwxceqarafmiy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYnF2Y3psd3hjZXFhcmFmbWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU5ODAsImV4cCI6MjA5MTIzMTk4MH0.9PzC2a8unN7NiN_gFyNdg1wgUCXHdMqJxvDlgmvsU7M'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  // Check allocations columns
  const { data: allocs, error: err1 } = await supabase.from('allocations').select('*').limit(5);
  console.log('allocations columns:', Object.keys(allocs?.[0] || {}), err1);
  
  // Try the exact query from fetchFlights
  const { data: allocs2, error: err2 } = await supabase
    .from('allocations')
    .select(`
      flight_num,
      stand_id,
      arr_time,
      dep_time,
      flights (
        flight_num,
        reg_no,
        aircraft_type,
        airline,
        origin,
        destination,
        pax_in,
        pax_out,
        connection_type
      )
    `)
    .limit(5);
  console.log('full allocations query:', allocs2, err2);
}
check();