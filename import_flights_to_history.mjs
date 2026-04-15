import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// =====================================================
// Configuration
// =====================================================
const supabaseUrl = 'https://lnbqvczlwxceqarafmiy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYnF2Y3psd3hjZXFhcmFmbWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU5ODAsImV4cCI6MjA5MTIzMTk4MH0.9PzC2a8unN7NiN_gFyNdg1wgUCXHdMqJxvDlgmvsU7M'

const supabase = createClient(supabaseUrl, supabaseKey)

// CSV file path - update this to your actual file path
const CSV_FILE_PATH = 'C:/Users/MICROMEDIA/AppData/Local/Packages/5319275A.WhatsAppDesktop_cv1g1gvanyjgm/LocalState/sessions/4BC46973118CEBB0EC9C20944D862772D73C7AA7/transfers/2026-15/Ops_july_cleaned_v5.csv'

// =====================================================
// CSV Parsing Functions
// =====================================================
function parseCSV(content) {
  const lines = content.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }
  
  return rows
}

// =====================================================
// Date Parsing Helper
// =====================================================
function parseDateTimeFromCSV(dateStr, timeStr) {
  if (!timeStr) return null
  try {
    // Handle date format: "2025-07-01 03:15:00"
    const datePart = dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr
    const dateTime = new Date(`${datePart}T${timeStr}`)
    if (isNaN(dateTime.getTime())) {
      // Try alternative parsing
      return new Date(`${dateStr} ${timeStr}`).toISOString()
    }
    return dateTime.toISOString()
  } catch (e) {
    console.error('Date parse error:', dateStr, timeStr, e)
    return null
  }
}

// =====================================================
// Main Import Function
// =====================================================
async function importFlights() {
  console.log('🚀 Starting flight data import...\n')
  
  // Step 1: Read and parse CSV
  console.log('📖 Reading CSV file...')
  let csvContent
  try {
    csvContent = readFileSync(CSV_FILE_PATH, 'utf-8')
  } catch (error) {
    console.error('❌ Error reading CSV file:', error.message)
    console.log('Please update CSV_FILE_PATH in this script with the correct file path')
    return
  }
  
  const rows = parseCSV(csvContent)
  console.log(`✅ Parsed ${rows.length} flights from CSV\n`)
  
  // Step 2: Get existing flight numbers to validate
  console.log('🔍 Fetching existing flights from database...')
  const { data: existingFlights, error: fetchError } = await supabase
    .from('flights')
    .select('flight_num')
  
  if (fetchError) {
    console.error('❌ Error fetching flights:', fetchError)
    return
  }
  
  const existingFlightNums = new Set(existingFlights.map(f => f.flight_num))
  console.log(`✅ Found ${existingFlights.length} existing flights\n`)
  
  // Step 3: Process each row - create 2 records per flight (delay_type 0 and 1)
  const historyFlightTimeRecords = []
  const historyAllocationRecords = []
  let processedCount = 0
  let skippedCount = 0
  let missingFlights = []
  
  for (const row of rows) {
    const flightNum = row.MVMTNO
    
    // Check if flight exists in database
    if (!existingFlightNums.has(flightNum)) {
      missingFlights.push(flightNum)
      skippedCount++
      continue
    }
    
    // Parse scheduled times (STA/STD)
    const scheduledArrTime = parseDateTimeFromCSV(row.STA, row.STD ? row.STD.split(' ')[1] : null)
    const scheduledDepTime = parseDateTimeFromCSV(row.STA, row.STD ? row.STD.split(' ')[1] : null)
    
    // Parse actual times (CHOXON/CHOXOFF)
    const actualArrTime = parseDateTimeFromCSV(row.STA, row.CHOXON)
    const actualDepTime = parseDateTimeFromCSV(row.STA, row.CHOXOFF)
    
    // Row 1: Scheduled times (delay_type = 0)
    if (scheduledArrTime && scheduledDepTime) {
      historyFlightTimeRecords.push({
        flight_num: flightNum,
        arr_time: scheduledArrTime,
        dep_time: scheduledDepTime,
        delay_type: 0
      })
    }
    
    // Row 2: Actual times (delay_type = 1)
    if (actualArrTime && actualDepTime) {
      historyFlightTimeRecords.push({
        flight_num: flightNum,
        arr_time: actualArrTime,
        dep_time: actualDepTime,
        delay_type: 1
      })
    }
    
    // History allocation records (delay_type 0 and 1)
    const standId = row.BAY
    if (standId) {
      historyAllocationRecords.push({
        flight_num: flightNum,
        stand_id: standId,
        delay_type: 0
      })
      
      historyAllocationRecords.push({
        flight_num: flightNum,
        stand_id: standId,
        delay_type: 1
      })
    }
    
    processedCount++
  }
  
  console.log(`📊 Processing summary:`)
  console.log(`   - Processed: ${processedCount}`)
  console.log(`   - Skipped (not in DB): ${skippedCount}`)
  console.log(`   - history_flight_time records: ${historyFlightTimeRecords.length}`)
  console.log(`   - history_allocation records: ${historyAllocationRecords.length}\n`)
  
  if (missingFlights.length > 0) {
    console.log(`⚠️  Flights not found in database (first 10): ${missingFlights.slice(0, 10).join(', ')}\n`)
  }
  
  // Step 4: Insert history_flight_time records
  if (historyFlightTimeRecords.length > 0) {
    console.log('💾 Inserting history_flight_time records...')
    const { error: insertError } = await supabase
      .from('history_flight_time')
      .insert(historyFlightTimeRecords)
      .select()
    
    if (insertError) {
      console.error('❌ Error inserting history_flight_time:', insertError)
      console.log('Make sure the history_flight_time table exists. Run the SQL script first!\n')
    } else {
      console.log(`✅ Successfully inserted ${historyFlightTimeRecords.length} history_flight_time records\n`)
    }
  }
  
  // Step 5: Insert history_allocation records
  if (historyAllocationRecords.length > 0) {
    console.log('💾 Inserting history_allocation records...')
    const { error: allocError } = await supabase
      .from('history_allocation')
      .insert(historyAllocationRecords)
      .select()
    
    if (allocError) {
      console.error('❌ Error inserting history_allocation:', allocError)
      console.log('Make sure the history_allocation table exists. Run the SQL script first!\n')
    } else {
      console.log(`✅ Successfully inserted ${historyAllocationRecords.length} history_allocation records\n`)
    }
  }
  
  console.log('🎉 Import complete!')
}

// =====================================================
// Run the import
// =====================================================
importFlights().catch(console.error)
