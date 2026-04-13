import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lnbqvczlwxceqarafmiy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYnF2Y3psd3hjZXFhcmFmbWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU5ODAsImV4cCI6MjA5MTIzMTk4MH0.9PzC2a8unN7NiN_gFyNdg1wgUCXHdMqJxvDlgmvsU7M'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  // Test insert a remove filter
  const { data, error } = await supabase.from('stand_code_filter').insert({
    stand_id: '4',
    operation: 'remove',
    flight_num: 'G9501'
  }).select()
  console.log('Insert result:', data, error);
  
  // Fetch filters for stand 4
  const { data: filters, error: err } = await supabase.from('stand_code_filter').select('*').eq('stand_id', '4');
  console.log('Filters for stand 4:', filters, err);
}
check();