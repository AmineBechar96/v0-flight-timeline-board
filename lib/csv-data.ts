import type { Flight, FlightType, ConnectionType } from "./types"

/**
 * CSV row structure from allocation files
 */
export interface CsvAllocationRow {
  MVMTNO: string
  AIRL: string
  "A/CTYPE": string
  STA: string
  STD: string
  LOADTYPE: string
  DESTN: string
  PAXIN: string
  PAXOUT: string
  HIST_STAND: string
  MODEL_STAND: string
  TYPE: string
}

/**
 * Convert timestamp string to hours from midnight (0-24)
 */
export function timestampToHours(timestamp: string): number {
  const date = new Date(timestamp)
  return date.getHours() + date.getMinutes() / 60
}

/**
 * Compute duration in hours between two timestamps
 */
export function computeDuration(arrTime: string, depTime: string): number {
  const arr = new Date(arrTime).getTime()
  const dep = new Date(depTime).getTime()
  return Math.max((dep - arr) / (1000 * 60 * 60), 0.25)
}

/**
 * Derive flight type from STA/STD presence
 */
export function deriveFlightType(sta: string | null, std: string | null): FlightType {
  // In CSV data, all flights have both STA and STD (turnarounds)
  // If only STA exists → arrival
  // If only STD exists → departure  
  // If both exist → turnaround (most common in gate stand data)
  if (sta && std) return "turnaround"
  if (sta && !std) return "arrival"
  if (!sta && std) return "departure"
  return "turnaround"
}

/**
 * Parse CSV string into array of objects
 */
export function parseCsv(csvText: string): CsvAllocationRow[] {
  const lines = csvText.trim().split("\n")
  if (lines.length < 2) return []
  
  const headers = lines[0].split(",").map(h => h.trim())
  const rows: CsvAllocationRow[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim())
    const row: Record<string, string> = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ""
    })
    
    rows.push(row as unknown as CsvAllocationRow)
  }
  
  return rows
}

/**
 * Map airline codes to full names (simplified for demo)
 */
const airlineNames: Record<string, string> = {
  ABY: "Air Arabia",
  KQA: "Kenya Airways",
  QTR: "Qatar Airways",
  AXB: "Air India Express",
  PGT: "Pegasus Airlines",
  IGO: "IndiGo",
  MSC: "Air Cairo",
  SIA: "Singapore Airlines",
  ETH: "Ethiopian Airlines",
  FJL: "Flysal",
  UPS: "UPS Airlines",
  PIA: "Pakistan International",
  SYR: "Syrian Air",
  SVA: "Saudi Arabian Airlines",
  MNB: "Mongolian Airways",
  AMA: "Air Arabia Morocco",
  KNE: "Nesma Airlines",
  ABQ: "Airblue",
  GTI: "Atlas Air",
  // Add more as needed
}

/**
 * Convert CSV row to Flight object
 */
export function csvRowToFlight(row: CsvAllocationRow): Flight {
  const airlineCode = row.AIRL || ""
  const airlineName = airlineNames[airlineCode] || airlineCode
  const sta = row.STA || null
  const std = row.STD || null
  
  // For arrivals (no STD), STA is arrival time
  // For departures (no STA), STD is departure time
  // For turnarounds (both exist), STA is arrival, STD is departure
  const isArrival = !std || std.trim() === ""
  const isDeparture = !sta || sta.trim() === ""
  
  let startTime: number
  let duration: number
  
  if (isArrival && !isDeparture) {
    // Pure arrival - STA is arrival time, no departure
    startTime = timestampToHours(sta)
    duration = 1 // Default 1 hour turnaround
  } else if (isDeparture && !isArrival) {
    // Pure departure - STD is departure time
    startTime = timestampToHours(std) - 1 // Assume 1 hour block time before
    duration = 1
  } else {
    // Turnaround - STA is arrival, STD is departure
    startTime = timestampToHours(sta!)
    duration = computeDuration(sta!, std!)
  }
  
  const paxIn = parseInt(row.PAXIN) || 0
  const paxOut = parseInt(row.PAXOUT) || 0
  const stand = row.MODEL_STAND || row.HIST_STAND || ""
  
  // Create flight number with airline code prefix (e.g., "ABY25064353" instead of "25064353")
  const flightNumber = `${airlineCode}${row.MVMTNO}`
  
  return {
    id: `${airlineCode}_${row.MVMTNO}`,
    flightNumber: flightNumber,
    airline: airlineName,
    airlineCode,
    origin: isArrival ? row.DESTN : undefined,
    destination: !isDeparture ? row.DESTN : undefined,
    aircraftType: row["A/CTYPE"] || "Unknown",
    registration: "", // Not available in CSV
    stand,
    startTime,
    duration,
    endTime: startTime + duration,
    type: deriveFlightType(sta, std),
    status: "scheduled",
    connectionType: null,
    passengers: paxIn + paxOut || undefined,
  }
}

/**
 * CSV loading result with status
 */
export interface CsvLoadResult {
  flights: Flight[]
  success: boolean
  error?: string
  filename?: string
}

/**
 * Load flights from a CSV allocation file
 * Each file represents one day of non-optimized allocations
 */
export async function loadCsvFlights(date: string): Promise<CsvLoadResult> {
  try {
    // The CSV file naming convention: allocation_M1_YYYYMMDD.csv
    // Format the date: 2025-07-01 -> 20250701
    const dateFormatted = date.replace(/-/g, "")
    const filename = `allocation_M1_${dateFormatted}.csv`
    
    const response = await fetch(`/data/${filename}`)
    
    if (!response.ok) {
      console.error(`CSV file not found: ${filename}`)
      return {
        flights: [],
        success: false,
        error: `File "${filename}" not found. Please upload it or choose another date.`,
        filename
      }
    }
    
    const csvText = await response.text()
    const rows = parseCsv(csvText)
    
    if (rows.length === 0) {
      return {
        flights: [],
        success: false,
        error: `File "${filename}" is empty or has invalid format.`,
        filename
      }
    }
    
    const flights = rows.map(csvRowToFlight)
    
    return {
      flights,
      success: true,
      filename
    }
  } catch (error) {
    console.error("Error loading CSV flights:", error)
    return {
      flights: [],
      success: false,
      error: `Failed to load CSV file. Please check the file format.`,
    }
  }
}

/**
 * Get list of available CSV files from the public/data directory
 */
export async function getAvailableCsvDates(): Promise<string[]> {
  try {
    const response = await fetch("/api/csv-files")
    if (!response.ok) {
      // If API doesn't exist, try to return empty array
      return []
    }
    const data = await response.json()
    return data.dates || []
  } catch {
    return []
  }
}

// ============================================================
// OPTIMIZED CSV (Monthly file - all flights in one file)
// ============================================================

/**
 * Optimized CSV row structure
 */
export interface OptimizedCsvRow {
  SL: string
  MVMTNO: string
  AIRL: string
  "A/CTYPE": string
  STA: string      // Scheduled time (for date filtering)
  BAY: string      // Stand assignment
  LOADTYPE: string
  CHOXON: string  // Actual arrival time
  STD: string      // Scheduled departure
  DESTN: string
  CHOXOFF: string  // Actual departure time
  PAXOUT: string
  TRFRPAX: string
  PAXIN: string
}

/**
 * Parse optimized CSV string into array of objects
 */
export function parseOptimizedCsv(csvText: string): OptimizedCsvRow[] {
  const lines = csvText.trim().split("\n")
  if (lines.length < 2) return []
  
  // Skip the first line (row number 1 in the file)
  const headers = lines[0].split(",").map(h => h.trim())
  const rows: OptimizedCsvRow[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim())
    const row: Record<string, string> = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ""
    })
    
    rows.push(row as unknown as OptimizedCsvRow)
  }
  
  return rows
}

/**
 * Convert optimized CSV row to Flight object
 * Uses CHOXON (actual arrival) and CHOXOFF (actual departure)
 */
export function optimizedCsvRowToFlight(row: OptimizedCsvRow, dateStr: string): Flight | null {
  const airlineCode = row.AIRL || ""
  const airlineName = airlineNames[airlineCode] || airlineCode
  
  // Use CHOXON for arrival time, CHOXOFF for departure time
  const choxOn = row.CHOXON || ""
  const choxOff = row.CHOXOFF || ""
  
  if (!choxOn && !choxOff) {
    return null // No valid time data
  }
  
  // Parse the CHOXON time (format: "2025-07-01 03:15:00" or "03:15:00")
  const arrivalTime = parseOptimizedTime(choxOn, dateStr)
  const departureTime = parseOptimizedTime(choxOff, dateStr)
  
  // Calculate duration
  const duration = departureTime > arrivalTime 
    ? departureTime - arrivalTime 
    : 1 // Default 1 hour if no valid duration
  
  const paxOut = parseInt(row.PAXOUT) || 0
  const paxIn = parseInt(row.PAXIN) || 0
  const trfrPax = parseInt(row.TRFRPAX) || 0
  
  // Create flight number with airline code prefix (e.g., "ABY25064353" instead of "25064353")
  const flightNumber = `${airlineCode}${row.MVMTNO}`
  
  return {
    id: `${airlineCode}_${row.MVMTNO}`,
    flightNumber: flightNumber,
    airline: airlineName,
    airlineCode,
    origin: row.DESTN, // For arrivals, destination is origin
    destination: row.DESTN,
    aircraftType: row["A/CTYPE"] || "Unknown",
    registration: "",
    stand: row.BAY || "",
    startTime: arrivalTime,
    duration: Math.max(duration, 0.25),
    endTime: arrivalTime + Math.max(duration, 0.25),
    type: "turnaround", // All flights in optimized are typically turnarounds
    status: "scheduled",
    connectionType: null,
    passengers: paxOut + paxIn + trfrPax || undefined,
  }
}

/**
 * Parse time string from optimized CSV
 * Handles formats: "2025-07-01 03:15:00" or "03:15:00"
 */
function parseOptimizedTime(timeStr: string, dateStr: string): number {
  if (!timeStr) return 0
  
  let hours = 0, minutes = 0
  
  if (timeStr.includes("-")) {
    // Full datetime format: "2025-07-01 03:15:00"
    const match = timeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/)
    if (match) {
      hours = parseInt(match[4])
      minutes = parseInt(match[5])
    }
  } else {
    // Time only format: "03:15:00"
    const match = timeStr.match(/(\d{2}):(\d{2})/)
    if (match) {
      hours = parseInt(match[1])
      minutes = parseInt(match[2])
    }
  }
  
  return hours + minutes / 60
}

/**
 * Optimized CSV loading result
 */
export interface OptimizedCsvLoadResult {
  flights: Flight[]
  success: boolean
  error?: string
  filename?: string
  totalFlights?: number
  filteredCount?: number
}

/**
 * Load flights from the optimized monthly CSV file
 * Automatically filters by the selected date
 */
export async function loadOptimizedCsvFlights(date: string): Promise<OptimizedCsvLoadResult> {
  try {
    // The optimized file contains all flights for July 2025
    const filename = "Ops_july_cleaned_v5.csv"
    
    const response = await fetch(`/data/${filename}`)
    
    if (!response.ok) {
      return {
        flights: [],
        success: false,
        error: `Optimized file "${filename}" not found. Please ensure it exists in public/data/`,
        filename
      }
    }
    
    const csvText = await response.text()
    const allRows = parseOptimizedCsv(csvText)
    
    if (allRows.length === 0) {
      return {
        flights: [],
        success: false,
        error: `Optimized file "${filename}" is empty or has invalid format.`,
        filename
      }
    }
    
    // Filter rows by the selected date
    // STA contains the scheduled date in format "2025-07-01 03:15:00"
    const selectedDateStr = date // e.g., "2025-07-01"
    
    const filteredRows = allRows.filter(row => {
      if (!row.STA) return false
      // Check if STA starts with the selected date
      return row.STA.startsWith(selectedDateStr)
    })
    
    // Convert filtered rows to flights
    const flights = filteredRows
      .map(row => optimizedCsvRowToFlight(row, date))
      .filter((flight): flight is Flight => flight !== null)
    
    return {
      flights,
      success: true,
      filename,
      totalFlights: allRows.length,
      filteredCount: flights.length
    }
  } catch (error) {
    console.error("Error loading optimized CSV:", error)
    return {
      flights: [],
      success: false,
      error: "Failed to load optimized CSV file."
    }
  }
}
