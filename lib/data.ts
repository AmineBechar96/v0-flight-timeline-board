import { supabase } from "./supabase"
import type { Flight, FlightType, Stand, Airline } from "./types"

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
  // Mock data since airplanes table doesn't exist in the provided schema
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
  return "turnaround" // fallback
}

/**
 * Convert a timestamp to hours from midnight (0-24).
 */
function timestampToHours(timestamp: string): number {
  const date = new Date(timestamp)
  return date.getUTCHours() + date.getUTCMinutes() / 60
}

/**
 * Compute duration in hours between two timestamps.
 */
function computeDuration(arrTime: string, depTime: string): number {
  const arr = new Date(arrTime).getTime()
  const dep = new Date(depTime).getTime()
  return Math.max((dep - arr) / (1000 * 60 * 60), 0.25) // minimum 15 min
}

/**
 * Fetch flights joined with allocations and airlines.
 * Maps DB schema to the UI Flight interface.
 */
export async function fetchFlights(airlinesMap?: Map<string, string>): Promise<Flight[]> {
  // Fetch flights with their allocations
  const { data: allocations, error: allocError } = await supabase
    .from("allocations")
    .select(`
      flight_num,
      stand_id,
      arr_time,
      dep_time,
      flights (
        flight_num,
        reg_no,
        aircraft_type,
        airline,
        origin,
        destination,
        pax_in,
        pax_out
      )
    `)

  if (allocError) {
    console.error("Error fetching allocations:", allocError)
    return []
  }

  if (!allocations || allocations.length === 0) return []

  // Build airlines map if not provided
  let airlineNameMap = airlinesMap
  if (!airlineNameMap) {
    const airlines = await fetchAirlines()
    airlineNameMap = new Map(airlines.map((a) => [a.iataCode, a.fullName]))
  }

  return allocations
    .filter((alloc) => alloc.flights && alloc.arr_time && alloc.dep_time)
    .map((alloc) => {
      const f = alloc.flights as unknown as Record<string, unknown>
      const airlineCode = (f.airline as string) ?? ""
      const origin = f.origin as string | null
      const destination = f.destination as string | null

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
        startTime: timestampToHours(alloc.arr_time!),
        duration: computeDuration(alloc.arr_time!, alloc.dep_time!),
        type: deriveFlightType(origin, destination),
        status: "scheduled" as const,
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
  // Update the allocation
  const { error: updateError } = await supabase
    .from("allocations")
    .update({ stand_id: newStand })
    .eq("flight_num", flightNum)
    .eq("stand_id", oldStand)

  if (updateError) {
    console.error("Error reassigning flight:", updateError)
    return false
  }

  // Log the change
  await supabase.from("allocation_changes").insert({
    flight_num: flightNum,
    old_stand: oldStand,
    new_stand: newStand,
    reason: reason ?? "Manual reassignment from timeline board",
  })

  return true
}
