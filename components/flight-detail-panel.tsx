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
  CheckCircle2,
  Edit,
  Trash2,
  Copy,
  MessageSquare,
  Bell,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Flight } from "@/lib/mock-flights"
import { airlineColors } from "@/lib/mock-flights"
import { cn } from "@/lib/utils"

interface FlightDetailPanelProps {
  flight: Flight | null
  onClose: () => void
}

// Turnaround phases for visualization
const turnaroundPhases = [
  { id: "arrival", name: "Arrival", duration: 5, icon: PlaneLanding, color: "bg-emerald-500" },
  { id: "deplane", name: "Deplaning", duration: 15, icon: Users, color: "bg-blue-500" },
  { id: "cleaning", name: "Cabin Cleaning", duration: 20, icon: CheckCircle2, color: "bg-amber-500" },
  { id: "catering", name: "Catering", duration: 25, icon: Plane, color: "bg-purple-500" },
  { id: "fueling", name: "Fueling", duration: 20, icon: Plane, color: "bg-orange-500" },
  { id: "boarding", name: "Boarding", duration: 25, icon: Users, color: "bg-sky-500" },
  { id: "departure", name: "Departure", duration: 10, icon: PlaneTakeoff, color: "bg-rose-500" },
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

  // Calculate total turnaround time in minutes
  const totalTurnaroundMinutes = turnaroundPhases.reduce((sum, phase) => sum + phase.duration, 0)
  const flightDurationMinutes = Math.round(flight.duration * 60)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", airlineColor.split(" ")[0])}>
                <TypeIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{flight.flightNumber}</h2>
                <p className="text-sm text-muted-foreground">{flight.airline}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold uppercase",
                flight.status === "scheduled" && "bg-blue-500/20 text-blue-400",
                flight.status === "boarding" && "bg-emerald-500/20 text-emerald-400",
                flight.status === "delayed" && "bg-amber-500/20 text-amber-400",
                flight.status === "completed" && "bg-muted text-muted-foreground",
                flight.status === "cancelled" && "bg-red-500/20 text-red-400"
              )}
            >
              {flight.status}
            </span>
            <span className="text-xs text-muted-foreground">
              {flight.type.charAt(0).toUpperCase() + flight.type.slice(1)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Route Visualization */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Route
            </h3>
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                {/* Origin */}
                <div className="flex flex-col items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/10">
                    <span className="text-lg font-bold text-emerald-400">
                      {flight.origin || "---"}
                    </span>
                  </div>
                  <span className="mt-2 text-xs text-muted-foreground">Origin</span>
                  {flight.origin && (
                    <span className="text-xs font-medium text-foreground">
                      {formatTime(flight.startTime)}
                    </span>
                  )}
                </div>

                {/* Flight path visualization */}
                <div className="relative flex-1 mx-4">
                  <div className="absolute inset-y-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-primary to-sky-500" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card p-1">
                    <Plane className="h-5 w-5 rotate-90 text-primary" />
                  </div>
                  {/* Duration label */}
                  <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    <Clock className="mr-1 inline h-3 w-3" />
                    {Math.round(flight.duration * 60)} min
                  </div>
                </div>

                {/* Destination */}
                <div className="flex flex-col items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-sky-500 bg-sky-500/10">
                    <span className="text-lg font-bold text-sky-400">
                      {flight.destination || "---"}
                    </span>
                  </div>
                  <span className="mt-2 text-xs text-muted-foreground">Destination</span>
                  {flight.destination && (
                    <span className="text-xs font-medium text-foreground">
                      {formatTime(flight.startTime + flight.duration)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Flight Details Grid */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Flight Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Plane className="h-4 w-4" />
                  <span className="text-xs">Aircraft</span>
                </div>
                <p className="mt-1 font-semibold text-foreground">{flight.aircraftType}</p>
                <p className="text-xs text-muted-foreground">{flight.registration}</p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs">Stand / Gate</span>
                </div>
                <p className="mt-1 font-semibold text-foreground">{flight.stand}</p>
                <p className="text-xs text-muted-foreground">Gate {flight.gate}</p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Schedule</span>
                </div>
                <p className="mt-1 font-semibold text-foreground">
                  {formatTime(flight.startTime)} - {formatTime(flight.startTime + flight.duration)}
                </p>
                <p className="text-xs text-muted-foreground">{flightDurationMinutes} minutes</p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Passengers</span>
                </div>
                <p className="mt-1 font-semibold text-foreground">{flight.passengers}</p>
                <p className="text-xs text-muted-foreground">Booked</p>
              </div>
            </div>
          </section>

          {/* Turnaround Timeline (only for turnaround flights) */}
          {flight.type === "turnaround" && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Turnaround Timeline
              </h3>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                {/* Progress bar */}
                <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-muted">
                  {turnaroundPhases.map((phase, index) => (
                    <div
                      key={phase.id}
                      className={cn(
                        phase.color,
                        "h-full transition-all",
                        index === 0 && "rounded-l-full",
                        index === turnaroundPhases.length - 1 && "rounded-r-full"
                      )}
                      style={{ width: `${(phase.duration / totalTurnaroundMinutes) * 100}%` }}
                    />
                  ))}
                </div>

                {/* Phase list */}
                <div className="space-y-2">
                  {turnaroundPhases.map((phase, index) => {
                    const PhaseIcon = phase.icon
                    const startOffset = turnaroundPhases
                      .slice(0, index)
                      .reduce((sum, p) => sum + p.duration, 0)
                    const phaseStartTime = flight.startTime + startOffset / 60

                    return (
                      <div
                        key={phase.id}
                        className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors"
                      >
                        <div className={cn("flex h-7 w-7 items-center justify-center rounded", phase.color)}>
                          <PhaseIcon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{phase.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-foreground">{phase.duration} min</p>
                          <p className="text-[10px] text-muted-foreground">{formatTime(phaseStartTime)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Total */}
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm font-medium text-muted-foreground">Total Turnaround</span>
                  <span className="text-sm font-semibold text-foreground">{totalTurnaroundMinutes} min</span>
                </div>
              </div>
            </section>
          )}

          {/* Alerts (if delayed or cancelled) */}
          {(flight.status === "delayed" || flight.status === "cancelled") && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Alerts
              </h3>
              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3",
                  flight.status === "delayed" && "border-amber-500/50 bg-amber-500/10",
                  flight.status === "cancelled" && "border-red-500/50 bg-red-500/10"
                )}
              >
                <AlertTriangle
                  className={cn(
                    "mt-0.5 h-5 w-5 shrink-0",
                    flight.status === "delayed" && "text-amber-400",
                    flight.status === "cancelled" && "text-red-400"
                  )}
                />
                <div>
                  <p
                    className={cn(
                      "font-medium",
                      flight.status === "delayed" && "text-amber-400",
                      flight.status === "cancelled" && "text-red-400"
                    )}
                  >
                    {flight.status === "delayed" ? "Flight Delayed" : "Flight Cancelled"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {flight.status === "delayed"
                      ? "This flight is experiencing delays. Updated schedule pending."
                      : "This flight has been cancelled. Passengers have been notified."}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Action Buttons */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="justify-start gap-2">
                <Edit className="h-4 w-4" />
                Edit Flight
              </Button>
              <Button variant="secondary" className="justify-start gap-2">
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
              <Button variant="secondary" className="justify-start gap-2">
                <MessageSquare className="h-4 w-4" />
                Add Note
              </Button>
              <Button variant="secondary" className="justify-start gap-2">
                <Bell className="h-4 w-4" />
                Set Alert
              </Button>
              <Button variant="secondary" className="justify-start gap-2 col-span-2">
                <ArrowRight className="h-4 w-4" />
                Reassign Stand
              </Button>
              <Button variant="destructive" className="justify-start gap-2 col-span-2">
                <Trash2 className="h-4 w-4" />
                Cancel Flight
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
