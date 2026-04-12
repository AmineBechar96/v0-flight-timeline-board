import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lnbqvczlwxceqarafmiy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYnF2Y3psd3hjZXFhcmFmbWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU5ODAsImV4cCI6MjA5MTIzMTk4MH0.9PzC2a8unN7NiN_gFyNdg1wgUCXHdMqJxvDlgmvsU7M'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: compat, error: err1 } = await supabase.from('stand_compatibility').select('*').limit(5);
  console.log('compat:', compat, err1);

  const { data: flights, error: err2 } = await supabase.from('flights').select('reg_no, aircraft_type').not('reg_no', 'is', null).limit(5);
  console.log('flights:', flights, err2);
}
check();
