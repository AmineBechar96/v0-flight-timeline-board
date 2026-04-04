"use client"

import { useState, useEffect } from "react"
import { Plane, Clock, CalendarDays, Filter, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TimelineHeaderProps {
  totalFlights: number
  activeFlights: number
  maintenanceZones: number
  onRefresh: () => void
}

export function TimelineHeader({ totalFlights, activeFlights, maintenanceZones, onRefresh }: TimelineHeaderProps) {
  const [formattedDate, setFormattedDate] = useState("")
  const [formattedTime, setFormattedTime] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const currentTime = new Date()
      setFormattedDate(
        currentTime.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      )
      setFormattedTime(
        currentTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Plane className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Stand Allocation Board</h1>
              <p className="text-xs text-muted-foreground">Real-time flight operations</p>
            </div>
          </div>

          <div className="ml-8 flex items-center gap-6 border-l border-border pl-8">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{formattedDate || "---"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-foreground">{formattedTime || "--:--"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{totalFlights}</p>
              <p className="text-xs text-muted-foreground">Total Flights</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{activeFlights}</p>
              <p className="text-xs text-muted-foreground">Active Now</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{maintenanceZones}</p>
              <p className="text-xs text-muted-foreground">Maintenance</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
