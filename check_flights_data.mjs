import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lnbqvczlwxceqarafmiy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYnF2Y3psd3hjZXFhcmFmbWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU5ODAsImV4cCI6MjA5MTIzMTk4MH0.9PzC2a8unN7NiN_gFyNdg1wgUCXHdMqJxvDlgmvsU7M'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  // Check flights table structure
  const { data: flights, error: err1 } = await supabase.from('flights').select('*').limit(10);
  console.log('flights table sample:', JSON.stringify(flights, null, 2), err1);
  
  // Check allocations table
  const { data: allocs, error: err2 } = await supabase.from('allocations').select('*').limit(10);
  console.log('allocations table sample:', JSON.stringify(allocs, null, 2), err2);
  
  // Check codes table
  const { data: codes, error: err3 } = await supabase.from('codes').select('*').limit(10);
  console.log('codes table:', codes, err3);
  
  // Check if there's a relationship between flights and codes
  const { data: stands, error: err4 } = await supabase.from('stands').select('*').limit(10);
  console.log('stands table:', JSON.stringify(stands, null, 2), err4);
}
check();