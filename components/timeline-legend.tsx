"use client"

import { PlaneLanding, PlaneTakeoff, ArrowLeftRight, Wrench } from "lucide-react"
import type { Airline } from "@/lib/types"
import { airlineColors } from "@/lib/types"

interface TimelineLegendProps {
  airlines?: Airline[]
}

export function TimelineLegend({ airlines = [] }: TimelineLegendProps) {
  const displayAirlines = airlines.slice(0, 5)
  const remaining = airlines.length - displayAirlines.length

  return (
    <div className="flex items-center gap-6 border-b border-border bg-card/50 px-6 py-3">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Stand</span>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20">
            <PlaneLanding className="h-3 w-3 text-emerald-400" />
          </div>
          <span className="text-xs text-foreground">Arrival</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-sky-500/20">
            <PlaneTakeoff className="h-3 w-3 text-sky-400" />
          </div>
          <span className="text-xs text-foreground">Departure</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/20">
            <ArrowLeftRight className="h-3 w-3 text-amber-400" />
          </div>
          <span className="text-xs text-foreground">Turnaround</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-rose-500/20">
            <Wrench className="h-3 w-3 text-rose-400" />
          </div>
          <span className="text-xs text-foreground">Maintenance</span>
        </div>
      </div>

      {airlines.length > 0 && (
        <div className="ml-auto flex items-center gap-4">
          <span className="text-xs text-muted-foreground">Airlines:</span>
          {displayAirlines.map((airline) => {
            const colorClass = airlineColors[airline.iataCode]?.split(" ")[0] ?? "bg-gray-600"
            return (
              <div key={airline.iataCode} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-sm ${colorClass}`} />
                <span className="text-xs text-foreground">{airline.iataCode}</span>
              </div>
            )
          })}
          {remaining > 0 && (
            <span className="text-xs text-muted-foreground">+{remaining} more</span>
          )}
        </div>
      )}
    </div>
  )
}
