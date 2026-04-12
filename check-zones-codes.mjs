import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lnbqvczlwxceqarafmiy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYnF2Y3psd3hjZXFhcmFmbWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU5ODAsImV4cCI6MjA5MTIzMTk4MH0.9PzC2a8unN7NiN_gFyNdg1wgUCXHdMqJxvDlgmvsU7M'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: zones } = await supabase.from('zones').select('*').limit(2)
  const { data: codes } = await supabase.from('codes').select('*').limit(2)
  console.log('Zones:', zones)
  console.log('Codes:', codes)
}

check()
