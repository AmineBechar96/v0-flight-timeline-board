export type FlightType = "arrival" | "departure" | "turnaround"
export type FlightStatus = "scheduled" | "boarding" | "delayed" | "completed" | "cancelled"
export type AircraftType = "A320" | "A321" | "A330" | "A350" | "B737" | "B747" | "B777" | "B787" | "E190"

export interface Flight {
  id: string
  flightNumber: string
  airline: string
  airlineCode: string
  origin?: string
  destination?: string
  aircraftType: AircraftType
  registration: string
  stand: string
  startTime: number // hours from midnight (0-24)
  duration: number // in hours
  type: FlightType
  status: FlightStatus
  passengers?: number
  gate?: string
  delayMinutes?: number // delay in minutes (1-400), undefined if no delay
}

export interface MaintenanceZone {
  id: string
  stand: string
  startTime: number
  duration: number
  reason: string
  priority: "low" | "medium" | "high"
}

const airlines = [
  { code: "BA", name: "British Airways", color: "bg-blue-600" },
  { code: "LH", name: "Lufthansa", color: "bg-amber-500" },
  { code: "AF", name: "Air France", color: "bg-blue-500" },
  { code: "KL", name: "KLM", color: "bg-sky-500" },
  { code: "EK", name: "Emirates", color: "bg-red-600" },
  { code: "QR", name: "Qatar Airways", color: "bg-rose-700" },
  { code: "SQ", name: "Singapore Airlines", color: "bg-orange-500" },
  { code: "UA", name: "United Airlines", color: "bg-blue-800" },
  { code: "AA", name: "American Airlines", color: "bg-red-500" },
  { code: "DL", name: "Delta Air Lines", color: "bg-blue-700" },
  { code: "EY", name: "Etihad Airways", color: "bg-amber-600" },
  { code: "TK", name: "Turkish Airlines", color: "bg-red-700" },
]

const aircraftTypes: AircraftType[] = ["A320", "A321", "A330", "A350", "B737", "B747", "B777", "B787", "E190"]
const statuses: FlightStatus[] = ["scheduled", "boarding", "delayed", "completed", "cancelled"]
const flightTypes: FlightType[] = ["arrival", "departure", "turnaround"]

const airports = ["JFK", "LAX", "ORD", "DFW", "DEN", "SFO", "SEA", "LAS", "MIA", "BOS", "ATL", "PHX", "CDG", "FRA", "AMS", "MAD", "FCO", "LHR", "DXB", "SIN", "HND", "ICN", "HKG", "SYD"]

// Generate 37 stands
export const stands: string[] = []
const standConfig = [
  { terminal: "T1", count: 12 },
  { terminal: "T2", count: 12 },
  { terminal: "T3", count: 13 },
]
for (const config of standConfig) {
  for (let i = 1; i <= config.count; i++) {
    stands.push(`${config.terminal}-${String(i).padStart(2, "0")}`)
  }
}

function generateFlightNumber(airlineCode: string): string {
  return `${airlineCode}${Math.floor(Math.random() * 9000) + 100}`
}

function generateRegistration(airlineCode: string): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const suffix = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join("")
  const prefixes: Record<string, string> = {
    BA: "G-",
    LH: "D-",
    AF: "F-",
    KL: "PH-",
    EK: "A6-",
    QR: "A7-",
    SQ: "9V-",
    UA: "N",
    AA: "N",
    DL: "N",
    EY: "A6-",
    TK: "TC-",
  }
  return `${prefixes[airlineCode] || "G-"}${suffix}`
}

// Generate 85+ flights distributed across all stands
export function generateFlights(): Flight[] {
  const flights: Flight[] = []
  let flightId = 1

  // Distribute flights across the day to avoid too much overlap
  for (const stand of stands) {
    // Each stand gets 2-4 flights throughout the day
    const numFlights = Math.floor(Math.random() * 3) + 2
    let currentTime = Math.random() * 3 // Start between 0-3 hours

    for (let i = 0; i < numFlights && currentTime < 22; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)]
      const type = flightTypes[Math.floor(Math.random() * flightTypes.length)]
      const duration = type === "turnaround" ? 1.5 + Math.random() * 2 : 0.5 + Math.random() * 1.5
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      
      // Generate delay for some flights (about 25% chance, weighted towards shorter delays)
      let delayMinutes: number | undefined = undefined
      if (Math.random() < 0.25) {
        // Weighted distribution: more short delays, fewer long delays
        const delayRandom = Math.random()
        if (delayRandom < 0.5) {
          delayMinutes = Math.floor(Math.random() * 30) + 1 // 1-30 min (50% chance)
        } else if (delayRandom < 0.8) {
          delayMinutes = Math.floor(Math.random() * 70) + 31 // 31-100 min (30% chance)
        } else if (delayRandom < 0.95) {
          delayMinutes = Math.floor(Math.random() * 100) + 101 // 101-200 min (15% chance)
        } else {
          delayMinutes = Math.floor(Math.random() * 200) + 201 // 201-400 min (5% chance)
        }
      }

      flights.push({
        id: `FL-${String(flightId++).padStart(4, "0")}`,
        flightNumber: generateFlightNumber(airline.code),
        airline: airline.name,
        airlineCode: airline.code,
        origin: type === "departure" ? undefined : airports[Math.floor(Math.random() * airports.length)],
        destination: type === "arrival" ? undefined : airports[Math.floor(Math.random() * airports.length)],
        aircraftType: aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)],
        registration: generateRegistration(airline.code),
        stand,
        startTime: currentTime,
        duration,
        type,
        status,
        passengers: Math.floor(Math.random() * 300) + 50,
        gate: `G${Math.floor(Math.random() * 50) + 1}`,
        delayMinutes,
      })

      currentTime += duration + 0.5 + Math.random() * 3 // Gap between flights
    }
  }

  return flights
}

export function generateMaintenanceZones(): MaintenanceZone[] {
  const zones: MaintenanceZone[] = []
  const reasons = ["Runway cleaning", "Stand inspection", "Equipment maintenance", "Safety check", "Lighting repair", "Markings refresh"]
  const priorities: ("low" | "medium" | "high")[] = ["low", "medium", "high"]

  // Add 8-12 maintenance zones across random stands
  const numZones = Math.floor(Math.random() * 5) + 8
  const usedSlots = new Set<string>()

  for (let i = 0; i < numZones; i++) {
    const stand = stands[Math.floor(Math.random() * stands.length)]
    const startTime = Math.floor(Math.random() * 20) + 1
    const duration = 0.5 + Math.random() * 2
    const slotKey = `${stand}-${startTime}`

    if (!usedSlots.has(slotKey)) {
      usedSlots.add(slotKey)
      zones.push({
        id: `MZ-${String(i + 1).padStart(3, "0")}`,
        stand,
        startTime,
        duration,
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
      })
    }
  }

  return zones
}

export const airlineColors: Record<string, string> = {
  BA: "bg-blue-600 border-blue-400",
  LH: "bg-amber-500 border-amber-300",
  AF: "bg-blue-500 border-blue-300",
  KL: "bg-sky-500 border-sky-300",
  EK: "bg-red-600 border-red-400",
  QR: "bg-rose-700 border-rose-500",
  SQ: "bg-orange-500 border-orange-300",
  UA: "bg-blue-800 border-blue-600",
  AA: "bg-red-500 border-red-300",
  DL: "bg-blue-700 border-blue-500",
  EY: "bg-amber-600 border-amber-400",
  TK: "bg-red-700 border-red-500",
}

export const typeColors: Record<FlightType, string> = {
  arrival: "border-l-emerald-400",
  departure: "border-l-sky-400",
  turnaround: "border-l-amber-400",
}

export const statusColors: Record<FlightStatus, string> = {
  scheduled: "opacity-100",
  boarding: "opacity-100 ring-2 ring-emerald-400",
  delayed: "opacity-90 ring-2 ring-amber-400",
  completed: "opacity-60",
  cancelled: "opacity-40 line-through",
}
