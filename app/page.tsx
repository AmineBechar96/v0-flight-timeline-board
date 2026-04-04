"use client"

import { useState, useMemo, useCallback } from "react"
import { TimelineHeader } from "@/components/timeline-header"
import { TimelineLegend } from "@/components/timeline-legend"
import { TimelineGrid } from "@/components/timeline-grid"
import { generateFlights, generateMaintenanceZones } from "@/lib/mock-flights"

export default function StandAllocationBoard() {
  const [refreshKey, setRefreshKey] = useState(0)

  const flights = useMemo(() => generateFlights(), [refreshKey])
  const maintenanceZones = useMemo(() => generateMaintenanceZones(), [refreshKey])

  // Calculate active flights (currently in progress based on current time)
  const activeFlights = useMemo(() => {
    const now = new Date()
    const currentHour = now.getHours() + now.getMinutes() / 60
    return flights.filter(
      (f) => f.startTime <= currentHour && f.startTime + f.duration >= currentHour && f.status !== "completed" && f.status !== "cancelled"
    ).length
  }, [flights])

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  return (
    <div className="flex h-screen flex-col bg-background">
      <TimelineHeader
        totalFlights={flights.length}
        activeFlights={activeFlights}
        maintenanceZones={maintenanceZones.length}
        onRefresh={handleRefresh}
      />
      <TimelineLegend />
      <TimelineGrid flights={flights} maintenanceZones={maintenanceZones} />
    </div>
  )
}
