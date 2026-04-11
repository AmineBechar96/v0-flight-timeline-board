"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { TimelineHeader } from "@/components/timeline-header"
import { TimelineLegend } from "@/components/timeline-legend"
import { TimelineGrid, type TimelineGridHandle } from "@/components/timeline-grid"
import { FilterControls, type FilterState } from "@/components/filter-controls"
import { ZoomControls } from "@/components/zoom-controls"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { FlightDetailPanel } from "@/components/flight-detail-panel"
import type { Flight, Airline } from "@/lib/types"
import type { MaintenanceZone } from "@/lib/types"
import { fetchFlights, fetchStands, fetchAirlines, reassignFlightStand } from "@/lib/data"

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3]

export default function StandAllocationBoard() {
  const [zoom, setZoom] = useState(1)
  const [showHelp, setShowHelp] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    airlines: [],
    connectionTypes: [],
    statuses: [],
  })
  const gridRef = useRef<TimelineGridHandle>(null)

  const [flightsData, setFlightsData] = useState<Flight[]>([])
  const [standsData, setStandsData] = useState<string[]>([])
  const [airlinesData, setAirlinesData] = useState<Airline[]>([])
  const [loading, setLoading] = useState(true)

  // No maintenance zones in the DB — empty array
  const maintenanceZones: MaintenanceZone[] = []

  // Fetch data from Supabase
  const loadData = useCallback(async () => {
    setLoading(true)
    const [stands, airlines, flights] = await Promise.all([
      fetchStands(),
      fetchAirlines(),
      fetchFlights(),
    ])
    setStandsData(stands.map((s) => s.id))
    setAirlinesData(airlines)
    setFlightsData(flights)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const allFlights = flightsData

  // Filter flights based on current filters
  const flights = useMemo(() => {
    return allFlights.filter((flight) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          flight.flightNumber.toLowerCase().includes(searchLower) ||
          flight.airline.toLowerCase().includes(searchLower) ||
          flight.airlineCode.toLowerCase().includes(searchLower) ||
          flight.stand.toLowerCase().includes(searchLower) ||
          flight.registration.toLowerCase().includes(searchLower) ||
          (flight.origin && flight.origin.toLowerCase().includes(searchLower)) ||
          (flight.destination && flight.destination.toLowerCase().includes(searchLower))
        if (!matchesSearch) return false
      }

      if (filters.airlines.length > 0) {
        if (!filters.airlines.includes(flight.airlineCode)) return false
      }

      if (filters.connectionTypes.length > 0) {
        if (!filters.connectionTypes.includes(flight.type)) return false
      }

      if (filters.statuses.length > 0) {
        if (!filters.statuses.includes(flight.status)) return false
      }

      return true
    })
  }, [allFlights, filters])

  // Calculate active flights
  const activeFlights = useMemo(() => {
    const now = new Date()
    const currentHour = now.getHours() + now.getMinutes() / 60
    return flights.filter(
      (f) =>
        f.startTime <= currentHour &&
        f.startTime + f.duration >= currentHour &&
        f.status !== "completed" &&
        f.status !== "cancelled"
    ).length
  }, [flights])

  const handleRefresh = useCallback(() => {
    loadData()
  }, [loadData])

  const handleZoomIn = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom)
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoom(ZOOM_LEVELS[currentIndex + 1])
    }
  }, [zoom])

  const handleZoomOut = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom)
    if (currentIndex > 0) {
      setZoom(ZOOM_LEVELS[currentIndex - 1])
    }
  }, [zoom])

  const handleResetZoom = useCallback(() => {
    setZoom(1)
  }, [])

  const handleFocusSearch = useCallback(() => {
    const searchInput = document.querySelector('input[placeholder="Search flights..."]') as HTMLInputElement
    searchInput?.focus()
  }, [])

  const handleScrollToNow = useCallback(() => {
    gridRef.current?.scrollToNow()
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: "",
      airlines: [],
      connectionTypes: [],
      statuses: [],
    })
  }, [])

  const handleFlightSelect = useCallback((flight: Flight) => {
    setSelectedFlight(flight)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedFlight(null)
  }, [])

  const handleFlightReassign = useCallback(async (flightId: string, newStand: string) => {
    const flight = flightsData.find((f) => f.id === flightId)
    if (!flight) return

    // Optimistic update
    setFlightsData((prev) =>
      prev.map((f) =>
        f.id === flightId ? { ...f, stand: newStand } : f
      )
    )

    // Persist to DB
    const success = await reassignFlightStand(flightId, flight.stand, newStand)
    if (!success) {
      // Revert on failure
      setFlightsData((prev) =>
        prev.map((f) =>
          f.id === flightId ? { ...f, stand: flight.stand } : f
        )
      )
    }
  }, [flightsData])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading flight data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <TimelineHeader
        totalFlights={flights.length}
        activeFlights={activeFlights}
        maintenanceZones={maintenanceZones.length}
        onRefresh={handleRefresh}
      />

      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-2">
        <FilterControls filters={filters} onFiltersChange={setFilters} airlines={airlinesData} />
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">?</span>
            Shortcuts
          </button>
          <ZoomControls zoom={zoom} onZoomChange={setZoom} />
        </div>
      </div>

      <TimelineLegend airlines={airlinesData} />
      <TimelineGrid
        ref={gridRef}
        flights={flights}
        maintenanceZones={maintenanceZones}
        zoom={zoom}
        stands={standsData}
        onFlightSelect={handleFlightSelect}
        onFlightReassign={handleFlightReassign}
      />

      <KeyboardShortcuts
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onRefresh={handleRefresh}
        onToggleHelp={() => setShowHelp((prev) => !prev)}
        onFocusSearch={handleFocusSearch}
        onScrollToNow={handleScrollToNow}
        onClearFilters={handleClearFilters}
      />

      <FlightDetailPanel flight={selectedFlight} onClose={handleClosePanel} />
    </div>
  )
}
