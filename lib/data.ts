import { supabase } from "./supabase"
import type { Flight, FlightType, Stand, Airline, ConnectionType, StandCodeFilter } from "./types"
import { ADJACENT_PBB_PAIRS } from "./types"

/**
 * Fetch all stands from Supabase, ordered by id.
 */
export async function fetchStands(): Promise<Stand[]> {
  try {
    // First try to fetch with accepted_aircraft_codes
    const { data: dataWithCodes, error: error1 } = await supabase
      .from("stands")
      .select("id, zone, code, is_closed, accepted_aircraft_codes")
      .order("id")

    // If no error and we have data, use it
    if (!error1 && dataWithCodes && dataWithCodes.length > 0) {
      return dataWithCodes.map((s) => ({
        id: s.id,
        zone: s.zone ?? null,
        code: s.code ?? null,
        isClosed: s.is_closed ?? false,
        acceptedAircraftCodes: s.accepted_aircraft_codes ?? [],
      }))
    }

    // If error, try without accepted_aircraft_codes (old schema)
    if (error1) {
      console.log("Trying fallback schema without accepted_aircraft_codes...")
    }
    
    // Try fallback query (either because of error or empty data)
    const result = await supabase
      .from("stands")
      .select("id, zone, code, is_closed")
      .order("id")
    
    if (result.error) {
      console.error("Error fetching stands:", result.error)
      return []
    }
    
    return (result.data ?? []).map((s) => ({
      id: s.id,
      zone: s.zone ?? null,
      code: s.code ?? null,
      isClosed: s.is_closed ?? false,
      acceptedAircraftCodes: [],
    }))
  } catch (err) {
    console.error("Exception fetching stands:", err)
    return []
  }
}

/**
 * Fetch all zones from Supabase.
 */
export async function fetchZones(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("zones")
    .select("id, description")
    .order("id")

  if (error) {
    console.error("Error fetching zones:", error)
    return []
  }

  return (data ?? []).map((z) => ({
    id: z.id,
    name: z.description ?? z.id,
  }))
}

/**
 * Fetch all codes from Supabase.
 */
export async function fetchCodes(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("codes")
    .select("id")
    .order("id")

  if (error) {
    console.error("Error fetching codes:", error)
    return []
  }

  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.id,
  }))
}

/**
 * Fetch all airplanes from Supabase, optionally filtered by code ID.
 */
export async function fetchAirplanes(codeId?: string): Promise<{ id: string; registration: string; aircraft_type: string; code_id?: string }[]> {
  const mockAirplanes = [
    { id: '1', registration: 'A6-EBA', aircraft_type: 'B777', code_id: 'E' },
    { id: '2', registration: 'A6-EBB', aircraft_type: 'B777', code_id: 'E' },
    { id: '3', registration: 'A6-ECA', aircraft_type: 'A380', code_id: 'F' },
    { id: '4', registration: 'A6-EDA', aircraft_type: 'A320', code_id: 'C' },
    { id: '5', registration: 'A6-EEA', aircraft_type: 'A330', code_id: 'D' },
    { id: '6', registration: 'A6-EFA', aircraft_type: 'A320', code_id: 'C' },
    { id: '7', registration: 'A6-EGA', aircraft_type: 'B787', code_id: 'D' },
    { id: '8', registration: 'A6-EHA', aircraft_type: 'B737', code_id: 'C' },
  ];
  
  if (codeId) {
    return mockAirplanes.filter(a => a.code_id === codeId);
  }
  return mockAirplanes;
}

/**
 * Fetch all airlines from Supabase.
 */
export async function fetchAirlines(): Promise<Airline[]> {
  const { data, error } = await supabase
    .from("airlines")
    .select("iata_code, full_name, is_aa_group, icao_code")
    .order("iata_code")

  if (error) {
    console.error("Error fetching airlines:", error)
    return []
  }

  return (data ?? []).map((a) => ({
    iataCode: a.iata_code,
    fullName: a.full_name ?? a.iata_code,
    isAaGroup: a.is_aa_group ?? false,
    icaoCode: a.icao_code,
  }))
}

/**
 * Derive flight type from origin/destination presence.
 */
function deriveFlightType(origin?: string | null, destination?: string | null): FlightType {
  if (origin && destination) return "turnaround"
  if (origin && !destination) return "arrival"
  if (!origin && destination) return "departure"
  return "turnaround"
}

/**
 * Convert a timestamp to hours from midnight (0-24).
 */
function timestampToHours(timestamp: string): number {
  const date = new Date(timestamp)
  return date.getHours() + date.getMinutes() / 60
}

/**
 * Compute duration in hours between two timestamps.
 */
function computeDuration(arrTime: string, depTime: string): number {
  const arr = new Date(arrTime).getTime()
  const dep = new Date(depTime).getTime()
  return Math.max((dep - arr) / (1000 * 60 * 60), 0.25)
}

/**
 * Fetch flights joined with allocations and airlines.
 */
export async function fetchFlights(airlinesMap?: Map<string, string>): Promise<Flight[]> {
  const { data: allocations, error: allocError } = await supabase
    .from("allocations")
    .select(`
      flight_num,
      stand_id,
      flights (
        flight_num,
        reg_no,
        aircraft_type,
        airline,
        origin,
        destination,
        pax_in,
        pax_out,
        connection_type,
        arr_time,
        dep_time
      )
    `)

  if (allocError) {
    console.error("Error fetching allocations:", allocError)
    return []
  }

  if (!allocations || allocations.length === 0) return []

  let airlineNameMap = airlinesMap
  if (!airlineNameMap) {
    const airlines = await fetchAirlines()
    airlineNameMap = new Map(airlines.map((a) => [a.iataCode, a.fullName]))
  }

  return allocations
    .filter((alloc) => {
      const f = alloc.flights as unknown as Record<string, unknown>
      return f && f.arr_time && f.dep_time
    })
    .map((alloc) => {
      const f = alloc.flights as unknown as Record<string, unknown>
      const airlineCode = (f.airline as string) ?? ""
      const origin = f.origin as string | null
      const destination = f.destination as string | null
      const dbConnectionType = f.connection_type as string | null
      const arrTime = f.arr_time as string
      const depTime = f.dep_time as string

      let connectionType: ConnectionType | null = null
      if (dbConnectionType) {
        const normalizedType = dbConnectionType.toLowerCase()
        if (normalizedType === "quick" || normalizedType === "no_connection" || normalizedType === "critical" || normalizedType === "priority") {
          connectionType = normalizedType as ConnectionType
        } else if (normalizedType === "normal") {
          connectionType = "quick"
        }
      }

      return {
        id: alloc.flight_num,
        flightNumber: alloc.flight_num,
        airline: airlineNameMap!.get(airlineCode) ?? airlineCode,
        airlineCode,
        origin: origin ?? undefined,
        destination: destination ?? undefined,
        aircraftType: (f.aircraft_type as string) ?? "Unknown",
        registration: (f.reg_no as string) ?? "",
        stand: alloc.stand_id,
        startTime: timestampToHours(arrTime),
        duration: computeDuration(arrTime, depTime),
        type: deriveFlightType(origin, destination),
        status: "scheduled" as const,
        connectionType,
        passengers: ((f.pax_in as number) ?? 0) + ((f.pax_out as number) ?? 0) || undefined,
      }
    })
}

/**
 * Reassign a flight to a new stand in the database.
 */
export async function reassignFlightStand(
  flightNum: string,
  oldStand: string,
  newStand: string,
  reason?: string
): Promise<boolean> {
  const { error: updateError } = await supabase
    .from("allocations")
    .update({ stand_id: newStand })
    .eq("flight_num", flightNum)
    .eq("stand_id", oldStand)

  if (updateError) {
    console.error("Error reassigning flight:", updateError)
    return false
  }

  await supabase.from("allocation_changes").insert({
    flight_num: flightNum,
    old_stand: oldStand,
    new_stand: newStand,
    reason: reason ?? "Manual reassignment from timeline board",
  })

  return true
}

/**
 * Fetch all stand code filters for a specific stand.
 */
export async function fetchStandCodeFilters(standId: string): Promise<StandCodeFilter[]> {
  const { data, error } = await supabase
    .from("stand_code_filter")
    .select("*")
    .eq("stand_id", standId)

  if (error) {
    console.error("Error fetching stand code filters:", error)
    return []
  }

  return (data ?? []).map((f) => ({
    id: f.id,
    stand_id: f.stand_id,
    operation: f.operation,
    aircraft_type: f.aircraft_type,
  }))
}

/**
 * Fetch all code aircraft type mappings.
 */
export async function fetchCodeAircraftTypes(): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from("code_aircraft_types")
    .select("code_id, aircraft_type")

  if (error) {
    console.error("Error fetching code aircraft types:", error)
    return {}
  }

  const mapping: Record<string, string[]> = {}
  for (const row of data ?? []) {
    if (!mapping[row.code_id]) {
      mapping[row.code_id] = []
    }
    mapping[row.code_id].push(row.aircraft_type)
  }
  
  return mapping
}

/**
 * Add an aircraft type to stand code filter.
 */
export async function addStandCodeFilter(
  standId: string,
  operation: "add" | "remove",
  aircraftType: string
): Promise<boolean> {
  const { error } = await supabase.from("stand_code_filter").insert({
    stand_id: standId,
    operation,
    aircraft_type: aircraftType,
  })

  if (error) {
    console.error("Error adding stand code filter:", error)
    return false
  }

  return true
}

/**
 * Remove a stand code filter by ID.
 */
export async function removeStandCodeFilter(filterId: number): Promise<boolean> {
  const { error } = await supabase
    .from("stand_code_filter")
    .delete()
    .eq("id", filterId)

  if (error) {
    console.error("Error removing stand code filter:", error)
    return false
  }

  return true
}

/**
 * Filter flights based on stand code filters.
 */
export function filterEligibleFlights<F extends { aircraftType: string }>(
  flights: F[],
  standCode: string | null,
  standCodeFilters: StandCodeFilter[],
  codeAircraftTypes: Record<string, string[]>
): F[] {
  if (!standCode) return flights

  const codeTypes = new Set(codeAircraftTypes[standCode] || [])
  const addFilters = standCodeFilters.filter((f) => f.operation === "add")
  const removeFilters = standCodeFilters.filter((f) => f.operation === "remove")
  const addedTypes = new Set(addFilters.map((f) => f.aircraft_type))
  const removedTypes = new Set(removeFilters.map((f) => f.aircraft_type))

  return flights.filter((flight) => {
    const aircraftType = flight.aircraftType

    if (removedTypes.has(aircraftType)) return false
    if (addedTypes.has(aircraftType)) return true
    return codeTypes.has(aircraftType)
  })
}

/**
 * Temporal overlap result interface
 */
export interface TemporalOverlapResult {
  hasOverlap: boolean
  overlappingFlights: Array<{
    flight: Flight
    gapMinutes: number
    isTooClose: boolean
  }>
  message: string | null
}

export interface AdjacentPbbConflictResult {
  hasConflict: boolean
  conflicts: Array<{
    flight: Flight
    gapMinutes: number
    type: string
  }>
  message: string | null
}

/**
 * Get the movement times (in hours from midnight) for a flight.
 * Arrivals have one movement at start time.
 * Departures have one movement at end time.
 * Turnarounds have movements at both start and end times.
 */
export function getFlightMovements(flight: Flight): number[] {
  const start = flight.startTime
  const end = flight.startTime + flight.duration
  if (flight.type === "arrival") return [start]
  if (flight.type === "departure") return [end]
  if (flight.type === "turnaround") return [start, end]
  return [start, end] // Fallback
}

/**
 * Check for adjacent PBB movement gap conflicts.
 */
export function checkAdjacentPbbOverlap(
  newFlight: Flight,
  standId: string,
  existingFlights: Flight[],
  gapMinutes: number = 5
): AdjacentPbbConflictResult {
  // Find adjacent stands
  const adjacentStands = new Set<string>()
  for (const pair of ADJACENT_PBB_PAIRS) {
    if (pair[0] === standId) adjacentStands.add(pair[1])
    if (pair[1] === standId) adjacentStands.add(pair[0])
  }
  
  if (adjacentStands.size === 0) {
    return { hasConflict: false, conflicts: [], message: null }
  }

  const conflicts: AdjacentPbbConflictResult['conflicts'] = []
  const newMovements = getFlightMovements(newFlight)
  const gapHours = gapMinutes / 60
  
  for (const flight of existingFlights) {
    if (flight.id === newFlight.id) continue
    if (!adjacentStands.has(flight.stand)) continue
    
    const existingMovements = getFlightMovements(flight)
    
    let minGapHours = Infinity
    for (const t1 of newMovements) {
      for (const t2 of existingMovements) {
        const gap = Math.abs(t1 - t2)
        if (gap < gapHours && gap < minGapHours) {
          minGapHours = gap
        }
      }
    }
    
    if (minGapHours < gapHours) {
      conflicts.push({
        flight,
        gapMinutes: Math.round(minGapHours * 60),
        type: flight.type
      })
    }
  }

  const hasConflict = conflicts.length > 0
  let message: string | null = null
  
  if (hasConflict && conflicts.length === 1) {
    const c = conflicts[0]
    message = `Adjacent PBB conflict: movement on stand ${standId} is within ${gapMinutes} min of movement on stand ${c.flight.stand} (gap: ${c.gapMinutes} min)`
  } else if (hasConflict) {
    message = `Adjacent PBB conflict: ${conflicts.length} movements are within ${gapMinutes} min of movements on stand ${standId}`
  }

  return { hasConflict, conflicts, message }
}

/**
 * Check for temporal overlap between flights on a stand.
 * Two flights must have at least minTurnaroundMinutes gap between them.
 * 
 * @param newFlight - The flight being assigned
 * @param standId - The target stand
 * @param existingFlights - All flights on that stand
 * @param minTurnaroundMinutes - Minimum gap required (default: 15)
 */
export function checkTemporalOverlap(
  newFlight: Flight,
  standId: string,
  existingFlights: Flight[],
  minTurnaroundMinutes: number = 15
): TemporalOverlapResult {
  const newStart = newFlight.startTime
  const newEnd = newFlight.startTime + newFlight.duration
  
  // Filter flights on the same stand (excluding the flight being moved)
  const standFlights = existingFlights.filter(
    f => f.stand === standId && f.id !== newFlight.id
  )

  const overlappingFlights: TemporalOverlapResult['overlappingFlights'] = []
  
  for (const flight of standFlights) {
    const flightStart = flight.startTime
    const flightEnd = flight.startTime + flight.duration
    
    // Calculate gap between flights
    // If new flight is after existing flight
    const gapMinutes = flightEnd < newStart 
      ? (newStart - flightEnd) * 60  // Gap after existing flight
      : flightStart > newEnd
        ? (flightStart - newEnd) * 60  // Gap before existing flight
        : 0  // Overlap

    const isTooClose = gapMinutes < minTurnaroundMinutes && gapMinutes >= 0
    
    if (isTooClose || (flightStart < newEnd && flightEnd > newStart)) {
      overlappingFlights.push({
        flight,
        gapMinutes: Math.round(gapMinutes),
        isTooClose,
      })
    }
  }

  const hasOverlap = overlappingFlights.length > 0
  
  let message: string | null = null
  if (hasOverlap && overlappingFlights.length === 1) {
    const conflict = overlappingFlights[0]
    message = `Overlap conflict on stand ${standId}: flight ${newFlight.flightNumber} and flight ${conflict.flight.flightNumber} have only ${conflict.gapMinutes} min gap (minimum ${minTurnaroundMinutes})`
  } else if (hasOverlap) {
    message = `Overlap conflict on stand ${standId}: ${overlappingFlights.length} flights have insufficient gap (minimum ${minTurnaroundMinutes} min)`
  }

  return {
    hasOverlap,
    overlappingFlights,
    message,
  }
}

/**
 * Fetch constraint configuration from database
 */
export async function fetchConstraintConfig(key: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("constraints_config")
    .select("value")
    .eq("key", key)
    .single()

  if (error) {
    console.log(`No constraint found for key: ${key}`)
    return null
  }

  return data?.value ?? null
}

/**
 * Fetch all constraint configurations
 */
export async function fetchAllConstraints(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("constraints_config")
    .select("key, value")

  if (error) {
    console.error("Error fetching constraints:", error)
    return {}
  }

  const result: Record<string, number> = {}
  for (const row of data ?? []) {
    result[row.key] = row.value
  }
  return result
}

/**
 * Save constraint configuration to database
 */
export async function saveConstraint(key: string, value: number): Promise<boolean> {
  const { error } = await supabase
    .from("constraints_config")
    .upsert({ key, value }, { onConflict: 'key' })

  if (error) {
    console.error("Error saving constraint:", error)
    return false
  }

  return true
}

/**
 * Get minimum turnaround minutes from config or default
 */
export async function getMinTurnaroundMinutes(): Promise<number> {
  const value = await fetchConstraintConfig('min_stand_turnaround_minutes')
  return value ?? 15
}

/**
 * Get adjacent PBB movement gap minutes from config or default
 */
export async function getAdjacentPbbGapMinutes(): Promise<number> {
  const value = await fetchConstraintConfig('adjacent_pbb_movement_gap_minutes')
  return value ?? 5
}

/**
 * Get the aircraft code (A-F) for a given aircraft type based on code_aircraft_types mapping.
 */
export function getAircraftCodeForType(
  aircraftType: string,
  codeAircraftTypes: Record<string, string[]>
): string | null {
  for (const [code, aircraftTypes] of Object.entries(codeAircraftTypes)) {
    if (aircraftTypes.includes(aircraftType)) {
      return code
    }
  }
  return null
}

/**
 * Check if a flight's aircraft type is compatible with a stand based on accepted codes.
 * Returns an error message if incompatible, null if compatible.
 */
export function checkAircraftCompatibility(
  aircraftType: string,
  stand: Stand,
  codeAircraftTypes: Record<string, string[]>,
  standCodeFilters: StandCodeFilter[] = []
): string | null {
  // Get the aircraft code for this type
  const aircraftCode = getAircraftCodeForType(aircraftType, codeAircraftTypes)
  
  // If we can't determine the aircraft code, allow it (backward compatibility)
  if (!aircraftCode) {
    return null
  }

  // Check if stand has explicit accepted codes
  if (stand.acceptedAircraftCodes.length > 0) {
    if (!stand.acceptedAircraftCodes.includes(aircraftCode)) {
      return `Aircraft type ${aircraftType} not compatible with stand ${stand.id}`
    }
  }

  // Check stand code filters (add/remove operations)
  const addFilters = standCodeFilters.filter((f) => f.operation === "add")
  const removeFilters = standCodeFilters.filter((f) => f.operation === "remove")
  
  // If there are add filters, only these types are allowed
  if (addFilters.length > 0) {
    const addedTypes = new Set(addFilters.map((f) => f.aircraft_type))
    if (!addedTypes.has(aircraftType)) {
      return `Aircraft type ${aircraftType} not compatible with stand ${stand.id}`
    }
  }

  // Check remove filters - if type is removed, it's not allowed
  const removedTypes = new Set(removeFilters.map((f) => f.aircraft_type))
  if (removedTypes.has(aircraftType)) {
    return `Aircraft type ${aircraftType} not compatible with stand ${stand.id}`
  }

  // Check if the code is in the default allowed types for the stand's code
  if (stand.code) {
    const defaultTypes = codeAircraftTypes[stand.code] || []
    if (!defaultTypes.includes(aircraftType) && addFilters.length === 0) {
      return `Aircraft type ${aircraftType} not compatible with stand ${stand.id}`
    }
  }

  return null
}

/**
 * Get stands that are compatible with a given flight (excludes incompatible stands from candidates).
 */
export function getCompatibleStands(
  flight: Flight,
  stands: Stand[],
  codeAircraftTypes: Record<string, string[]>,
  standFiltersMap: Map<string, StandCodeFilter[]> = new Map()
): Stand[] {
  return stands.filter((stand) => {
    // Skip closed stands
    if (stand.isClosed) return false
    
    // Check aircraft compatibility
    const compatibilityError = checkAircraftCompatibility(
      flight.aircraftType,
      stand,
      codeAircraftTypes,
      standFiltersMap.get(stand.id) || []
    )
    
    return compatibilityError === null
  })
}

/**
 * Save accepted aircraft codes for a stand.
 */
export async function saveStandAircraftCodes(
  standId: string,
  codes: string[]
): Promise<boolean> {
  // Try to update with accepted_aircraft_codes
  const { error } = await supabase
    .from("stands")
    .update({ accepted_aircraft_codes: codes })
    .eq("id", standId)

  if (error) {
    // If the column doesn't exist, just log and return success (backward compatibility)
    if (error.message && (error.message.includes('column') || error.message.includes('undefined'))) {
      console.log("accepted_aircraft_codes column not available, skipping save")
      return true
    }
    console.error("Error saving stand aircraft codes:", error)
    return false
  }

  return true
}
