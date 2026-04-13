export type FlightType = "arrival" | "departure" | "turnaround"
export type FlightStatus = "scheduled" | "boarding" | "delayed" | "completed" | "cancelled"
export type ConnectionType = "quick" | "no_connection" | "critical" | "priority"

export interface Flight {
  id: string
  flightNumber: string
  airline: string
  airlineCode: string
  origin?: string
  destination?: string
  aircraftType: string
  registration: string
  stand: string
  startTime: number // hours from midnight (0-24)
  duration: number // in hours
  type: FlightType
  status: FlightStatus
  connectionType: ConnectionType | null
  passengers?: number
  gate?: string
  delayMinutes?: number
}

export interface Stand {
  id: string
  zone: string | null
  code: string | null
  isClosed: boolean
}

export interface Airline {
  iataCode: string
  fullName: string
  isAaGroup: boolean
  icaoCode: string | null
}

export interface MaintenanceZone {
  id: string
  stand: string
  startTime: number
  duration: number
  reason: string
  priority: "low" | "medium" | "high"
}

// Airline color mapping for UI display
export const airlineColors: Record<string, string> = {
  G9: "bg-red-600 border-red-400",
  "3L": "bg-red-500 border-red-300",
  "3O": "bg-red-700 border-red-500",
  E5: "bg-red-800 border-red-600",
  "9P": "bg-orange-500 border-orange-300",
  QTR: "bg-rose-700 border-rose-500",
  SIA: "bg-orange-600 border-orange-400",
  ETH: "bg-emerald-600 border-emerald-400",
  IGO: "bg-blue-600 border-blue-400",
  AXB: "bg-amber-500 border-amber-300",
  KQA: "bg-green-700 border-green-500",
  MSR: "bg-blue-800 border-blue-600",
  MSC: "bg-sky-600 border-sky-400",
  PGT: "bg-yellow-600 border-yellow-400",
  PIA: "bg-green-600 border-green-400",
  SVA: "bg-emerald-700 border-emerald-500",
  SYR: "bg-slate-600 border-slate-400",
  UPS: "bg-amber-700 border-amber-500",
  GTI: "bg-blue-500 border-blue-300",
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
