// Re-export all types and constants from the new modules
// so existing component imports continue to work.
export type {
  Flight,
  FlightType,
  FlightStatus,
  MaintenanceZone,
  Stand,
  Airline,
} from "./types"

export {
  airlineColors,
  typeColors,
  statusColors,
} from "./types"

// Stands are now fetched from Supabase.
// This empty array is a fallback — components receive stands via props from page.tsx.
export const stands: string[] = []
