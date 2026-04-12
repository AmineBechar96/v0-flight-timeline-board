"use client"

import { useMemo, useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from "react"
import type { Flight, MaintenanceZone, Stand } from "@/lib/types"
import { FlightBlock } from "./flight-block"
import { MaintenanceBlock } from "./maintenance-block"
import { StandEditModal } from "./stand-edit-modal"
import { cn } from "@/lib/utils"
import { checkConflict, type ConflictResult } from "@/hooks/use-flight-drag"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface TimelineGridProps {
  flights: Flight[]
  maintenanceZones: MaintenanceZone[]
  zoom: number
  stands: Stand[]
  onFlightSelect?: (flight: Flight) => void
  onFlightReassign?: (flightId: string, newStand: string) => void
}

export interface TimelineGridHandle {
  scrollToNow: () => void
}

const BASE_HOUR_WIDTH = 100 // pixels per hour at 1x zoom
const ROW_HEIGHT = 36 // pixels per stand row
const HOURS = Array.from({ length: 25 }, (_, i) => i) // 0-24 hours

export const TimelineGrid = forwardRef<TimelineGridHandle, TimelineGridProps>(
  function TimelineGrid({ flights, maintenanceZones, zoom, stands, onFlightSelect, onFlightReassign }, ref) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const standScrollRef = useRef<HTMLDivElement>(null)
    const [currentTimePosition, setCurrentTimePosition] = useState(0)
    const [draggedFlight, setDraggedFlight] = useState<Flight | null>(null)
    const [targetStand, setTargetStand] = useState<string | null>(null)
    const [conflictResult, setConflictResult] = useState<ConflictResult | null>(null)
    const [showDropFeedback, setShowDropFeedback] = useState<{ stand: string; success: boolean } | null>(null)
    const [editingStand, setEditingStand] = useState<Stand | null>(null)
    const [draggedStand, setDraggedStand] = useState<string | null>(null)
    const [standOrder, setStandOrder] = useState<Stand[]>([])

    const hourWidth = BASE_HOUR_WIDTH * zoom

    // Expose scrollToNow method to parent
    useImperativeHandle(ref, () => ({
      scrollToNow: () => {
        if (scrollRef.current) {
          const now = new Date()
          const hours = now.getHours() + now.getMinutes() / 60
          const position = hours * hourWidth
          scrollRef.current.scrollLeft = Math.max(0, position - 300)
        }
      },
    }))

    // Calculate current time position
    useEffect(() => {
      const updateTimePosition = () => {
        const now = new Date()
        const hours = now.getHours() + now.getMinutes() / 60
        setCurrentTimePosition(hours * hourWidth)
      }

      updateTimePosition()
      const interval = setInterval(updateTimePosition, 60000) // Update every minute

      return () => clearInterval(interval)
    }, [hourWidth])

    // Scroll to current time on mount
    useEffect(() => {
      if (scrollRef.current && currentTimePosition > 0) {
        scrollRef.current.scrollLeft = Math.max(0, currentTimePosition - 300)
      }
    }, []) // Only on mount

    // Sort stands: 1, 2... 18, 19, 1a, 1b, 1c, 20, 21, 22
    const sortStands = (stands: Stand[]) => {
      return [...stands].sort((standA, standB) => {
        const a = standA.id
        const b = standB.id
        const matchA = a.match(/^(\d+)(.*)$/)
        const matchB = b.match(/^(\d+)(.*)$/)
        if (!matchA || !matchB) return a.localeCompare(b)
        
        const numStrA = matchA[1]
        const numStrB = matchB[1]
        const suffixA = matchA[2]
        const suffixB = matchB[2]
        const numA = parseInt(numStrA, 10)
        const numB = parseInt(numStrB, 10)
        
        // Compare by numeric prefix length first
        if (numStrA.length !== numStrB.length) {
          // Shorter prefix comes first (e.g., "1" before "18" before "100")
          // UNLESS the shorter one has a suffix that extends into the longer one's range
          if (suffixA && !suffixB) {
            // e.g., 1a vs 19: 1a's effective range is 10-19, so 1a should come after 19
            if (numA * 10 <= numB) return 1 // a (1a) comes after b (19)
            return -1
          }
          if (!suffixA && suffixB) {
            // e.g., 19 vs 1a: 19 should come before 1a
            if (numA <= numB * 10) return -1 // a (19) comes before b (1a)
            return 1
          }
          // Neither has suffix or both have suffix - compare by length
          return numStrA.length - numStrB.length
        }
        
        // Same prefix length - compare by number
        if (numA !== numB) {
          // If one has suffix and other doesn't, suffix comes after
          if (suffixA === "" && suffixB !== "") return -1
          if (suffixA !== "" && suffixB === "") return 1
          return numA - numB
        }
        
        // Same number - sort by suffix (empty first, then alphabetical)
        if (suffixA === "" && suffixB !== "") return -1
        if (suffixA !== "" && suffixB === "") return 1
        return suffixA.localeCompare(suffixB)
      })
    }

    // Initialize stand order
    useEffect(() => {
      setStandOrder(sortStands(stands))
    }, [stands])

    // Sync vertical scroll between stand column and timeline area
    useEffect(() => {
      const scrollContainer = scrollRef.current
      const standColumn = standScrollRef.current

      if (!scrollContainer || !standColumn) return

      const handleScroll = () => {
        if (standColumn.scrollTop !== scrollContainer.scrollTop) {
          standColumn.scrollTop = scrollContainer.scrollTop
        }
      }

      scrollContainer.addEventListener("scroll", handleScroll)
      return () => scrollContainer.removeEventListener("scroll", handleScroll)
    }, [])

    // Stand row drag handlers
    const handleStandDragStart = useCallback((e: React.DragEvent, stand: string) => {
      e.dataTransfer.setData("text/plain", stand)
      e.dataTransfer.effectAllowed = "move"
      setDraggedStand(stand)
    }, [])

    const handleStandDragOver = useCallback((e: React.DragEvent, targetStand: string) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
    }, [])

    const handleStandDrop = useCallback((e: React.DragEvent, targetStand: string) => {
      e.preventDefault()
      const sourceStand = e.dataTransfer.getData("text/plain")
      
      if (sourceStand && sourceStand !== targetStand) {
        setStandOrder(prev => {
          const newOrder = [...prev]
          const sourceIndex = newOrder.findIndex(s => s.id === sourceStand)
          const targetIndex = newOrder.findIndex(s => s.id === targetStand)
          if (sourceIndex === -1 || targetIndex === -1) return prev
          const sourceItem = newOrder[sourceIndex]
          newOrder.splice(sourceIndex, 1)
          newOrder.splice(targetIndex, 0, sourceItem)
          return newOrder
        })
      }
      
      setDraggedStand(null)
    }, [])

    // Group flights by stand
    const flightsByStand = useMemo(() => {
      const grouped: Record<string, Flight[]> = {}
      for (const standObj of stands) {
        grouped[standObj.id] = flights.filter((f) => f.stand === standObj.id)
      }
      return grouped
    }, [flights, stands])

    // Group maintenance zones by stand
    const maintenanceByStand = useMemo(() => {
      const grouped: Record<string, MaintenanceZone[]> = {}
      for (const standObj of stands) {
        grouped[standObj.id] = maintenanceZones.filter((m) => m.stand === standObj.id)
      }
      return grouped
    }, [maintenanceZones, stands])

    const formatHour = (hour: number) => {
      return `${String(hour % 24).padStart(2, "0")}:00`
    }

    // Drag handlers
    const handleDragStart = useCallback((flight: Flight) => {
      setDraggedFlight(flight)
    }, [])

    const handleDragEnd = useCallback(() => {
      setDraggedFlight(null)
      setTargetStand(null)
      setConflictResult(null)
    }, [])

    const handleDragOver = useCallback(
      (e: React.DragEvent, stand: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"

        if (draggedFlight && stand !== targetStand) {
          setTargetStand(stand)
          const result = checkConflict(draggedFlight, stand, flights)
          setConflictResult(result)
        }
      },
      [draggedFlight, targetStand, flights]
    )

    const handleDragLeave = useCallback(() => {
      setTargetStand(null)
      setConflictResult(null)
    }, [])

    const handleDrop = useCallback(
      (e: React.DragEvent, stand: string) => {
        e.preventDefault()

        try {
          const flightData = JSON.parse(e.dataTransfer.getData("application/json")) as Flight
          const result = checkConflict(flightData, stand, flights)

          if (!result.hasConflict && stand !== flightData.stand) {
            onFlightReassign?.(flightData.id, stand)
            setShowDropFeedback({ stand, success: true })
          } else if (result.hasConflict) {
            setShowDropFeedback({ stand, success: false })
          }
        } catch {
          // Invalid data
        }

        // Clear feedback after animation
        setTimeout(() => {
          setShowDropFeedback(null)
        }, 1500)

        setDraggedFlight(null)
        setTargetStand(null)
        setConflictResult(null)
      },
      [flights, onFlightReassign]
    )

    return (
      <div className="flex flex-1 overflow-hidden relative">
        {/* Conflict indicator overlay */}
        {draggedFlight && conflictResult && (
          <div className="absolute top-2 right-2 z-50 rounded-lg border bg-popover p-3 shadow-xl">
            {conflictResult.hasConflict ? (
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium text-sm">Conflict Detected</p>
                  <p className="text-xs text-muted-foreground">
                    {conflictResult.conflictingFlights.length} flight(s) within 15min buffer
                  </p>
                </div>
              </div>
            ) : targetStand && targetStand !== draggedFlight.stand ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium text-sm">Stand Available</p>
                  <p className="text-xs text-muted-foreground">Drop to assign to {targetStand}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium text-sm">Dragging {draggedFlight.flightNumber}</p>
                  <p className="text-xs">Hover over a stand row to check availability</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stand labels - fixed left column */}
        <div className="flex w-24 shrink-0 flex-col border-r border-border bg-card">
          <div className="flex h-10 items-center justify-center border-b border-border bg-muted/50 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Stand
          </div>
          <div ref={standScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {(standOrder.length > 0 ? standOrder : stands).map((standObj, index) => {
              const stand = standObj.id
              return (
              <div
                key={stand}
                draggable
                onDragStart={(e) => handleStandDragStart(e, stand)}
                onDragOver={(e) => handleStandDragOver(e, stand)}
                onDrop={(e) => handleStandDrop(e, stand)}
                onClick={() => setEditingStand(standObj)}
                className={cn(
                  "flex h-9 w-full items-center justify-center border-b border-border text-sm font-medium transition-all hover:bg-primary/10 hover:text-primary hover:cursor-pointer active:cursor-grabbing",
                  index % 2 === 0 ? "bg-card" : "bg-muted/30",
                  draggedStand === stand && "opacity-50 bg-primary/20 ring-2 ring-primary",
                  targetStand === stand && !conflictResult?.hasConflict && "bg-emerald-500/20",
                  targetStand === stand && conflictResult?.hasConflict && "bg-red-500/20"
                )}
              >
                <span className="text-foreground">{stand}</span>
              </div>
            )})}
          </div>
        </div>

        {/* Scrollable timeline area */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <div style={{ width: `${24 * hourWidth}px`, minWidth: "100%" }}>
            {/* Time header */}
            <div className="sticky top-0 z-20 flex h-10 border-b border-border bg-muted/50">
              {HOURS.slice(0, 24).map((hour) => (
                <div
                  key={hour}
                  className="flex shrink-0 items-center border-r border-border/50 px-2 text-xs font-medium text-muted-foreground"
                  style={{ width: `${hourWidth}px` }}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            <div className="relative">
              {/* Vertical grid lines */}
              <div className="pointer-events-none absolute inset-0">
                {HOURS.slice(0, 24).map((hour) => (
                  <div
                    key={hour}
                    className="absolute top-0 bottom-0 border-l border-border/30"
                    style={{ left: `${hour * hourWidth}px` }}
                  />
                ))}
                {/* Half-hour markers */}
                {HOURS.slice(0, 24).map((hour) => (
                  <div
                    key={`half-${hour}`}
                    className="absolute top-0 bottom-0 border-l border-border/15"
                    style={{ left: `${(hour + 0.5) * hourWidth}px` }}
                  />
                ))}
              </div>

              {/* Current time indicator */}
              {currentTimePosition > 0 && currentTimePosition < 24 * hourWidth && (
                <div
                  className="pointer-events-none absolute top-0 bottom-0 z-30 w-0.5 bg-primary"
                  style={{ left: `${currentTimePosition}px` }}
                >
                  <div className="absolute -top-0 -left-1.5 h-3 w-3 rounded-full bg-primary" />
                </div>
              )}

              {/* Stand rows */}
              {(standOrder.length > 0 ? standOrder : stands).map((standObj, index) => {
                const stand = standObj.id
                const isTarget = targetStand === stand
                const hasConflict = isTarget && conflictResult?.hasConflict
                const isAvailable = isTarget && !conflictResult?.hasConflict && draggedFlight?.stand !== stand
                const feedbackForStand = showDropFeedback?.stand === stand
                const isDragged = draggedStand === stand

                return (
                  <div
                    key={stand}
                    className={cn(
                      "relative border-b border-border transition-colors",
                      index % 2 === 0 ? "bg-card" : "bg-muted/20",
                      isDragged && "opacity-50 bg-primary/20 ring-2 ring-primary",
                      isTarget && "ring-2 ring-inset",
                      isAvailable && "bg-emerald-500/10 ring-emerald-500",
                      hasConflict && "bg-red-500/10 ring-red-500",
                      feedbackForStand && showDropFeedback.success && "animate-pulse bg-emerald-500/30",
                      feedbackForStand && !showDropFeedback.success && "animate-pulse bg-red-500/30"
                    )}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    onDragOver={(e) => handleDragOver(e, stand)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stand)}
                  >
                    {/* Drop zone indicator */}
                    {isTarget && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        {isAvailable && (
                          <div className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white shadow-lg">
                            <CheckCircle className="h-3 w-3" />
                            Drop here
                          </div>
                        )}
                        {hasConflict && (
                          <div className="flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white shadow-lg">
                            <XCircle className="h-3 w-3" />
                            Conflict
                          </div>
                        )}
                      </div>
                    )}

                    {/* Flight blocks */}
                    {flightsByStand[stand]?.map((flight) => (
                      <FlightBlock
                        key={flight.id}
                        flight={flight}
                        hourWidth={hourWidth}
                        onSelect={onFlightSelect}
                        isDragging={draggedFlight?.id === flight.id}
                        isConflicting={conflictResult?.conflictingFlights.some((f) => f.id === flight.id)}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                    {/* Maintenance blocks */}
                    {maintenanceByStand[stand]?.map((zone) => (
                      <MaintenanceBlock key={zone.id} zone={zone} hourWidth={hourWidth} />
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Stand Edit Modal */}
        <StandEditModal
          isOpen={!!editingStand}
          onClose={() => setEditingStand(null)}
          standId={editingStand?.id}
          currentZoneId={editingStand?.zone || ""}
          currentCodeId={editingStand?.code || ""}
          currentAirplanes=""
          currentActive={editingStand ? !editingStand.isClosed : true}
          onSave={(data) => {
            console.log("Save stand:", editingStand?.id, data)
            setEditingStand(null)
          }}
        />
      </div>
    )
  }
)
