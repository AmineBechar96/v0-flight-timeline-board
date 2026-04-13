import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lnbqvczlwxceqarafmiy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYnF2Y3psd3hjZXFhcmFmbWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU5ODAsImV4cCI6MjA5MTIzMTk4MH0.9PzC2a8unN7NiN_gFyNdg1wgUCXHdMqJxvDlgmvsU7M'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  // Check airlines table
  const { data: airlines, error: err1 } = await supabase.from('airlines').select('*').limit(20);
  console.log('airlines table:', JSON.stringify(airlines, null, 2), err1);
  
  // Check code_aircraft_types table
  const { data: codeAircraft, error: err2 } = await supabase.from('code_aircraft_types').select('*').limit(20);
  console.log('code_aircraft_types table:', JSON.stringify(codeAircraft, null, 2), err2);
  
  // Check stands with code to understand the pattern
  const { data: stands, error: err3 } = await supabase.from('stands').select('*').eq('code', 'C').limit(10);
  console.log('Stands with code C:', JSON.stringify(stands, null, 2), err3);
  
  // Check allocations to see which flights are on which stands
  const { data: allocs, error: err4 } = await supabase.from('allocations').select('*').limit(20);
  console.log('allocations:', JSON.stringify(allocs, null, 2), err4);
  
  // Get stands data to understand the pattern
  const { data: allStands, error: err5 } = await supabase.from('stands').select('*').limit(30);
  console.log('all stands:', JSON.stringify(allStands, null, 2), err5);
}
check();