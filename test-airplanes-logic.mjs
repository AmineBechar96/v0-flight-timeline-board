import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lnbqvczlwxceqarafmiy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYnF2Y3psd3hjZXFhcmFmbWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU5ODAsImV4cCI6MjA5MTIzMTk4MH0.9PzC2a8unN7NiN_gFyNdg1wgUCXHdMqJxvDlgmvsU7M'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const codeId = 'C';
  const { data: stands } = await supabase.from('stands').select('id').eq('code', codeId);
  console.log('Stands for code C:', stands);
  
  if (stands && stands.length > 0) {
    const standIds = stands.map(s => s.id);
    const { data: compat } = await supabase.from('stand_compatibility').select('aircraft_type').in('stand_id', standIds);
    console.log('Compat for stands:', compat);
    
    if (compat && compat.length > 0) {
      const types = Array.from(new Set(compat.map(c => c.aircraft_type)));
      console.log('Unique types:', types);
      
      const { data: flights } = await supabase.from('flights').select('reg_no, aircraft_type').in('aircraft_type', types).not('reg_no', 'is', null).limit(10);
      console.log('Flights:', flights);
    }
  }
}
run();