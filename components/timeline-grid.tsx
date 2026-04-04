"use client"

import { useMemo, useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react"
import type { Flight, MaintenanceZone } from "@/lib/mock-flights"
import { stands } from "@/lib/mock-flights"
import { FlightBlock } from "./flight-block"
import { MaintenanceBlock } from "./maintenance-block"
import { cn } from "@/lib/utils"

interface TimelineGridProps {
  flights: Flight[]
  maintenanceZones: MaintenanceZone[]
  zoom: number
  onFlightSelect?: (flight: Flight) => void
}

export interface TimelineGridHandle {
  scrollToNow: () => void
}

const BASE_HOUR_WIDTH = 100 // pixels per hour at 1x zoom
const ROW_HEIGHT = 36 // pixels per stand row
const HOURS = Array.from({ length: 25 }, (_, i) => i) // 0-24 hours

export const TimelineGrid = forwardRef<TimelineGridHandle, TimelineGridProps>(
  function TimelineGrid({ flights, maintenanceZones, zoom, onFlightSelect }, ref) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [currentTimePosition, setCurrentTimePosition] = useState(0)

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

    // Group flights by stand
    const flightsByStand = useMemo(() => {
      const grouped: Record<string, Flight[]> = {}
      for (const stand of stands) {
        grouped[stand] = flights.filter((f) => f.stand === stand)
      }
      return grouped
    }, [flights])

    // Group maintenance zones by stand
    const maintenanceByStand = useMemo(() => {
      const grouped: Record<string, MaintenanceZone[]> = {}
      for (const stand of stands) {
        grouped[stand] = maintenanceZones.filter((m) => m.stand === stand)
      }
      return grouped
    }, [maintenanceZones])

    const formatHour = (hour: number) => {
      return `${String(hour % 24).padStart(2, "0")}:00`
    }

    return (
      <div className="flex flex-1 overflow-hidden">
        {/* Stand labels - fixed left column */}
        <div className="flex w-24 shrink-0 flex-col border-r border-border bg-card">
          <div className="flex h-10 items-center justify-center border-b border-border bg-muted/50 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Stand
          </div>
          <div className="flex-1 overflow-hidden">
            {stands.map((stand, index) => (
              <div
                key={stand}
                className={cn(
                  "flex h-9 items-center justify-center border-b border-border text-sm font-medium",
                  index % 2 === 0 ? "bg-card" : "bg-muted/30"
                )}
              >
                <span className="text-foreground">{stand}</span>
              </div>
            ))}
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
              {stands.map((stand, index) => (
                <div
                  key={stand}
                  className={cn(
                    "relative border-b border-border",
                    index % 2 === 0 ? "bg-card" : "bg-muted/20"
                  )}
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  {/* Flight blocks */}
                  {flightsByStand[stand]?.map((flight) => (
                    <FlightBlock key={flight.id} flight={flight} hourWidth={hourWidth} onSelect={onFlightSelect} />
                  ))}
                  {/* Maintenance blocks */}
                  {maintenanceByStand[stand]?.map((zone) => (
                    <MaintenanceBlock key={zone.id} zone={zone} hourWidth={hourWidth} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
)
