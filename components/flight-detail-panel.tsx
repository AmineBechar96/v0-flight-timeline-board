"use client"

import { useEffect } from "react"
import {
  X,
  PlaneLanding,
  PlaneTakeoff,
  ArrowLeftRight,
  Users,
  Clock,
  Plane,
  MapPin,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Flight } from "@/lib/mock-flights"
import { airlineColors } from "@/lib/mock-flights"
import { cn } from "@/lib/utils"

interface FlightDetailPanelProps {
  flight: Flight | null
  onClose: () => void
}

// Simplified turnaround phases with requested percentages (10%, 25%, 30%, 25%, 10%)
const turnaroundPhases = [
  { id: "arrival", name: "Arrival", percent: 10, color: "bg-emerald-500" },
  { id: "deplaning", name: "Deplaning", percent: 25, color: "bg-blue-500" },
  { id: "cleaning", name: "Cleaning", percent: 30, color: "bg-amber-500" },
  { id: "boarding", name: "Boarding", percent: 25, color: "bg-sky-500" },
  { id: "departure", name: "Departure", percent: 10, color: "bg-rose-500" },
]

export function FlightDetailPanel({ flight, onClose }: FlightDetailPanelProps) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    if (flight) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [flight, onClose])

  if (!flight) return null

  const formatTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }

  const TypeIcon = {
    arrival: PlaneLanding,
    departure: PlaneTakeoff,
    turnaround: ArrowLeftRight,
  }[flight.type]

  const airlineColor = airlineColors[flight.airlineCode] || "bg-gray-600 border-gray-400"
  const flightDurationMinutes = Math.round(flight.duration * 60)

  // Aircraft size category
  const aircraftSize = ["A380", "B777", "B787", "A350"].includes(flight.aircraftType) ? "Wide-body" : "Narrow-body"

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel - 380px width */}
      <div className="fixed right-0 top-0 z-50 h-full w-[380px] overflow-y-auto border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-card">
          <div className="flex items-start justify-between p-4">
            <div>
              <h2 className="font-mono text-2xl font-bold text-foreground">{flight.flightNumber}</h2>
              <p className="text-sm text-muted-foreground">{flight.airline}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Route Visualization - Large airport codes with dashed line */}
          <section>
            <div className="rounded-lg border border-border bg-secondary/30 p-5">
              <div className="flex items-center justify-between">
                {/* Origin */}
                <div className="flex flex-col items-center">
                  <span className="font-mono text-3xl font-bold text-emerald-400">
                    {flight.origin || "---"}
                  </span>
                  <span className="mt-1 font-mono text-sm text-foreground">
                    {formatTime(flight.startTime)}
                  </span>
                </div>

                {/* Dashed arrow line with ground time */}
                <div className="relative flex-1 mx-6 flex flex-col items-center">
                  <div className="w-full border-t-2 border-dashed border-muted-foreground/50" />
                  <Plane className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-5 w-5 rotate-90 text-primary bg-secondary/30" />
                  <span className="mt-3 font-mono text-xs text-muted-foreground">
                    {flightDurationMinutes} min
                  </span>
                </div>

                {/* Destination */}
                <div className="flex flex-col items-center">
                  <span className="font-mono text-3xl font-bold text-sky-400">
                    {flight.destination || "---"}
                  </span>
                  <span className="mt-1 font-mono text-sm text-foreground">
                    {formatTime(flight.startTime + flight.duration)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Flight Details Section */}
          <section>
            <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Flight Details
            </h3>
            <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
              <div className="flex items-center justify-between py-1">
                <span className="font-mono text-xs text-muted-foreground">Status</span>
                <span
                  className={cn(
                    "rounded px-2 py-0.5 font-mono text-xs font-semibold uppercase",
                    flight.status === "scheduled" && "bg-blue-500/20 text-blue-400",
                    flight.status === "boarding" && "bg-emerald-500/20 text-emerald-400",
                    flight.status === "delayed" && "bg-amber-500/20 text-amber-400",
                    flight.status === "completed" && "bg-muted text-muted-foreground",
                    flight.status === "cancelled" && "bg-red-500/20 text-red-400"
                  )}
                >
                  {flight.status}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-border/50">
                <span className="font-mono text-xs text-muted-foreground">Connection</span>
                <span
                  className={cn(
                    "rounded px-2 py-0.5 font-mono text-xs font-semibold",
                    flight.type === "arrival" && "bg-emerald-500/20 text-emerald-400",
                    flight.type === "departure" && "bg-sky-500/20 text-sky-400",
                    flight.type === "turnaround" && "bg-amber-500/20 text-amber-400"
                  )}
                >
                  {flight.type.charAt(0).toUpperCase() + flight.type.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-border/50">
                <span className="font-mono text-xs text-muted-foreground">Aircraft</span>
                <span className="font-mono text-xs text-foreground">
                  {flight.aircraftType} <span className="text-muted-foreground">({aircraftSize})</span>
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-border/50">
                <span className="font-mono text-xs text-muted-foreground">Passengers</span>
                <span className="font-mono text-xs text-foreground">{flight.passengers} pax</span>
              </div>
            </div>
          </section>

          {/* Stand Info Section */}
          <section>
            <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Stand Info
            </h3>
            <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
              <div className="flex items-center justify-between py-1">
                <span className="font-mono text-xs text-muted-foreground">Assigned Stand</span>
                <span className="font-mono text-sm font-bold text-foreground">{flight.stand}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-border/50">
                <span className="font-mono text-xs text-muted-foreground">Arrival Time</span>
                <span className="font-mono text-xs text-foreground">{formatTime(flight.startTime)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-border/50">
                <span className="font-mono text-xs text-muted-foreground">Departure Time</span>
                <span className="font-mono text-xs text-foreground">{formatTime(flight.startTime + flight.duration)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-border/50">
                <span className="font-mono text-xs text-muted-foreground">Ground Time</span>
                <span className="font-mono text-xs font-semibold text-primary">{flightDurationMinutes} min</span>
              </div>
            </div>
          </section>

          {/* Turnaround Timeline - Simplified Gantt */}
          <section>
            <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Turnaround Timeline
            </h3>
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              {/* Mini Gantt bar */}
              <div className="mb-3 flex h-6 overflow-hidden rounded bg-muted">
                {turnaroundPhases.map((phase, index) => (
                  <div
                    key={phase.id}
                    className={cn(
                      phase.color,
                      "h-full flex items-center justify-center transition-all",
                      index === 0 && "rounded-l",
                      index === turnaroundPhases.length - 1 && "rounded-r"
                    )}
                    style={{ width: `${phase.percent}%` }}
                    title={`${phase.name}: ${phase.percent}%`}
                  >
                    {phase.percent >= 20 && (
                      <span className="font-mono text-[9px] font-bold text-white/90">{phase.percent}%</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Phase labels */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {turnaroundPhases.map((phase) => (
                  <div key={phase.id} className="flex items-center gap-1.5">
                    <div className={cn("h-2 w-2 rounded-sm", phase.color)} />
                    <span className="font-mono text-[10px] text-muted-foreground">{phase.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Actions Section */}
          <section>
            <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="justify-start gap-2 font-mono text-xs h-9">
                <ArrowRight className="h-3.5 w-3.5" />
                Reassign Stand
              </Button>
              <Button variant="secondary" className="justify-start gap-2 font-mono text-xs h-9">
                <AlertTriangle className="h-3.5 w-3.5" />
                Mark Delayed
              </Button>
              <Button variant="secondary" className="justify-start gap-2 font-mono text-xs h-9">
                <MessageSquare className="h-3.5 w-3.5" />
                Add Note
              </Button>
              <Button variant="secondary" className="justify-start gap-2 font-mono text-xs h-9">
                <History className="h-3.5 w-3.5" />
                View History
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
