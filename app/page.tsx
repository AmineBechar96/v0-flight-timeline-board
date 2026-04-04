"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { TimelineHeader } from "@/components/timeline-header"
import { TimelineLegend } from "@/components/timeline-legend"
import { TimelineGrid, type TimelineGridHandle } from "@/components/timeline-grid"
import { FilterControls, type FilterState } from "@/components/filter-controls"
import { ZoomControls } from "@/components/zoom-controls"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { FlightDetailPanel } from "@/components/flight-detail-panel"
import { generateFlights, generateMaintenanceZones, type Flight } from "@/lib/mock-flights"

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3]

export default function StandAllocationBoard() {
  const [refreshKey, setRefreshKey] = useState(0)
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
  const searchInputRef = useRef<HTMLInputElement>(null)

  const allFlights = useMemo(() => generateFlights(), [refreshKey])
  const maintenanceZones = useMemo(() => generateMaintenanceZones(), [refreshKey])

  // Filter flights based on current filters
  const flights = useMemo(() => {
    return allFlights.filter((flight) => {
      // Search filter
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

      // Airline filter
      if (filters.airlines.length > 0) {
        if (!filters.airlines.includes(flight.airlineCode)) return false
      }

      // Connection type filter
      if (filters.connectionTypes.length > 0) {
        if (!filters.connectionTypes.includes(flight.type)) return false
      }

      // Status filter
      if (filters.statuses.length > 0) {
        if (!filters.statuses.includes(flight.status)) return false
      }

      return true
    })
  }, [allFlights, filters])

  // Calculate active flights (currently in progress based on current time)
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
    setRefreshKey((prev) => prev + 1)
  }, [])

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
    // Find the search input and focus it
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

  return (
    <div className="flex h-screen flex-col bg-background">
      <TimelineHeader
        totalFlights={flights.length}
        activeFlights={activeFlights}
        maintenanceZones={maintenanceZones.length}
        onRefresh={handleRefresh}
      />

      {/* Filter and Zoom Controls Bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-2">
        <FilterControls filters={filters} onFiltersChange={setFilters} />
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

      <TimelineLegend />
      <TimelineGrid ref={gridRef} flights={flights} maintenanceZones={maintenanceZones} zoom={zoom} onFlightSelect={handleFlightSelect} />

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
