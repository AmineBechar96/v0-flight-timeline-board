import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lnbqvczlwxceqarafmiy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYnF2Y3psd3hjZXFhcmFmbWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU5ODAsImV4cCI6MjA5MTIzMTk4MH0.9PzC2a8unN7NiN_gFyNdg1wgUCXHdMqJxvDlgmvsU7M'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  // Try different table names
  const tables = ['code_aircraft', 'code_aircrafts', 'codes_aircraft', 'codes_aircrafts', 'aircraft', 'aircrafts']
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(5)
    if (!error) {
      console.log(`${table}:`, data)
    }
  }
}

check()
