"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { TimelineHeader } from "@/components/timeline-header"
import { TimelineGrid, type TimelineGridHandle } from "@/components/timeline-grid"
import { FilterControls, type FilterState } from "@/components/filter-controls"
import { ZoomControls } from "@/components/zoom-controls"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { FlightDetailPanel } from "@/components/flight-detail-panel"
import { CodesManagementModal } from "@/components/codes-management-modal"
import { StandDataProvider } from "@/hooks/use-stand-data"
import type { Flight, Airline, Stand } from "@/lib/types"
import type { MaintenanceZone } from "@/lib/types"
import { fetchFlights, fetchStands, fetchAirlines, reassignFlightStand } from "@/lib/data"
import { loadCsvFlights, loadOptimizedCsvFlights } from "@/lib/csv-data"
import type { AllocationMode } from "@/components/allocation-mode-switcher"

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3]

export default function StandAllocationBoard() {
  const [zoom, setZoom] = useState(1)
  const [showHelp, setShowHelp] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [showCodesModal, setShowCodesModal] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    airlines: [],
    flightTypes: [],
    dbConnectionTypes: [],
    statuses: [],
  })
  const gridRef = useRef<TimelineGridHandle>(null)

  const [flightsData, setFlightsData] = useState<Flight[]>([])
  const [standsData, setStandsData] = useState<Stand[]>([])
  const [airlinesData, setAirlinesData] = useState<Airline[]>([])
  const [loading, setLoading] = useState(true)

  // Date state for filtering flights by day
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to July 1st, 2025 for CSV demo (we have data for this date)
    return "2025-07-01"
  })

  // Allocation mode state - default to manual mode (loads CSV files)
  const [allocationMode, setAllocationMode] = useState<AllocationMode>("manual")

  // No maintenance zones in the DB — empty array
  const maintenanceZones: MaintenanceZone[] = []

  // Handle date navigation
  const handlePreviousDay = useCallback(() => {
    setSelectedDate((prev) => {
      const date = new Date(prev)
      date.setDate(date.getDate() - 1)
      return date.toISOString().split("T")[0]
    })
  }, [])

  const handleNextDay = useCallback(() => {
    setSelectedDate((prev) => {
      const date = new Date(prev)
      date.setDate(date.getDate() + 1)
      return date.toISOString().split("T")[0]
    })
  }, [])

  const handleToday = useCallback(() => {
    setSelectedDate(new Date().toISOString().split("T")[0])
  }, [])

  // CSV error state for showing messages
  const [csvError, setCsvError] = useState<string | null>(null)

  // Fetch data from Supabase or CSV
  const loadData = useCallback(async () => {
    setLoading(true)
    setCsvError(null) // Clear previous errors
    
    // Always fetch stands and airlines from Supabase
    const [stands, airlines] = await Promise.all([
      fetchStands(),
      fetchAirlines(),
    ])
    setStandsData(stands)
    setAirlinesData(airlines)
    
    // Fetch flights based on mode
    if (allocationMode === "manual") {
      // Load flights from Manual CSV file (daily files: allocation_M1_YYYYMMDD.csv)
      const result = await loadCsvFlights(selectedDate)
      if (result.success) {
        setFlightsData(result.flights)
      } else {
        // Show error but keep empty flights
        setFlightsData([])
        setCsvError(result.error || "Failed to load CSV file")
      }
    } else if (allocationMode === "optimized") {
      // Load flights from Optimized CSV file (monthly file: Ops_july_cleaned_v5.csv)
      const result = await loadOptimizedCsvFlights(selectedDate)
      if (result.success) {
        setFlightsData(result.flights)
      } else {
        // Show error but keep empty flights
        setFlightsData([])
        setCsvError(result.error || "Failed to load optimized CSV file")
      }
    }
    
    setLoading(false)
  }, [selectedDate, allocationMode])

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

      if (filters.flightTypes.length > 0) {
        if (!filters.flightTypes.includes(flight.type)) return false
      }

      if (filters.dbConnectionTypes.length > 0) {
        if (!flight.connectionType || !filters.dbConnectionTypes.includes(flight.connectionType)) return false
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
      flightTypes: [],
      dbConnectionTypes: [],
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
    <StandDataProvider>
      <div className="flex h-screen flex-col bg-background">
        {/* CSV Error Banner */}
        {csvError && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{csvError}</span>
            </div>
            <button
              onClick={() => setCsvError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <TimelineHeader
          totalFlights={flights.length}
          activeFlights={activeFlights}
          maintenanceZones={maintenanceZones.length}
          onRefresh={handleRefresh}
          selectedDate={selectedDate}
          onPreviousDay={handlePreviousDay}
          onNextDay={handleNextDay}
          onToday={handleToday}
          onDateChange={setSelectedDate}
          allocationMode={allocationMode}
          onAllocationModeChange={setAllocationMode}
        />

        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-2">
          <FilterControls filters={filters} onFiltersChange={setFilters} airlines={airlinesData} onOpenCodesManagement={() => setShowCodesModal(true)} />
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
        <CodesManagementModal isOpen={showCodesModal} onClose={() => setShowCodesModal(false)} />
      </div>
    </StandDataProvider>
  )
}
