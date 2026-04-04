"use client"

import { PlaneLanding, PlaneTakeoff, ArrowLeftRight, Wrench } from "lucide-react"

export function TimelineLegend() {
  return (
    <div className="flex items-center gap-6 border-b border-border bg-card/50 px-6 py-3">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Legend</span>
      
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

      <div className="ml-auto flex items-center gap-4">
        <span className="text-xs text-muted-foreground">Airlines:</span>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-blue-600" />
          <span className="text-xs text-foreground">BA</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-amber-500" />
          <span className="text-xs text-foreground">LH</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-sky-500" />
          <span className="text-xs text-foreground">KL</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-red-600" />
          <span className="text-xs text-foreground">EK</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-blue-700" />
          <span className="text-xs text-foreground">DL</span>
        </div>
        <span className="text-xs text-muted-foreground">+7 more</span>
      </div>
    </div>
  )
}
