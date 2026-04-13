import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lnbqvczlwxceqarafmiy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYnF2Y3psd3hjZXFhcmFmbWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU5ODAsImV4cCI6MjA5MTIzMTk4MH0.9PzC2a8unN7NiN_gFyNdg1wgUCXHdMqJxvDlgmvsU7M'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  // Try simple allocations query
  const { data: allocs, error: err1 } = await supabase.from('allocations').select('*').limit(5);
  console.log('allocations:', allocs, err1);
  
  // Try flights query
  const { data: flights, error: err2 } = await supabase.from('flights').select('*').limit(5);
  console.log('flights:', flights, err2);
  
  // Try with foreign key
  const { data: allocs2, error: err3 } = await supabase
    .from('allocations')
    .select('flight_num, stand_id, flights(flight_num, airline, aircraft_type)')
    .limit(5);
  console.log('allocations with join:', allocs2, err3);
}
check();