import { supabase } from "./supabase"
import type { Flight, FlightType, Stand, Airline, ConnectionType, StandCodeFilter } from "./types"

/**
 * Fetch all stands from Supabase, ordered by id.
 */
export async function fetchStands(): Promise<Stand[]> {
  const { data, error } = await supabase
    .from("stands")
    .select("id, zone, code, is_closed")
    .order("id")

  if (error) {
    console.error("Error fetching stands:", error)
    return []
  }

  return (data ?? []).map((s) => ({
    id: s.id,
    zone: s.zone,
    code: s.code,
    isClosed: s.is_closed ?? false,
  }))
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