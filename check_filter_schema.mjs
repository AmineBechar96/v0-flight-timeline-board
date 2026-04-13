import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lnbqvczlwxceqarafmiy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYnF2Y3psd3hjZXFhcmFmbWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU5ODAsImV4cCI6MjA5MTIzMTk4MH0.9PzC2a8unN7NiN_gFyNdg1wgUCXHdMqJxvDlgmvsU7M'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  // Get all columns of stand_code_filter
  const { data, error } = await supabase.from('stand_code_filter').select('*').limit(1);
  console.log('stand_code_filter columns:', Object.keys(data?.[0] || {}));
  console.log('stand_code_filter sample:', data);
  console.log('error:', error);
  
  // Try insert with aircraft_type
  const { data: insertData, error: insertError } = await supabase.from('stand_code_filter').insert({
    stand_id: '4',
    operation: 'remove',
    aircraft_type: 'A320'
  }).select()
  console.log('Insert with aircraft_type:', insertData, insertError);
}
check();