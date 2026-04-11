"use client"

import { useState } from "react"
import { Wrench, AlertCircle, Clock } from "lucide-react"
import type { MaintenanceZone } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MaintenanceBlockProps {
  zone: MaintenanceZone
  hourWidth: number
}

export function MaintenanceBlock({ zone, hourWidth }: MaintenanceBlockProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const left = zone.startTime * hourWidth
  const width = Math.max(zone.duration * hourWidth, 40)

  const priorityStyles = {
    low: "bg-amber-500/20 border-amber-500/40",
    medium: "bg-orange-500/30 border-orange-500/50",
    high: "bg-rose-500/40 border-rose-500/60",
  }

  const formatTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }

  return (
    <div
      className="group absolute top-1 bottom-1 cursor-pointer"
      style={{ left: `${left}px`, width: `${width}px` }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={cn(
          "relative flex h-full items-center justify-center gap-1 overflow-hidden rounded border border-dashed text-[10px] font-medium transition-all",
          priorityStyles[zone.priority],
          "hover:scale-[1.02] hover:shadow-lg hover:z-10"
        )}
      >
        <Wrench className="h-3 w-3 text-rose-400" />
      </div>

      {showTooltip && (
        <div className="absolute left-1/2 bottom-full z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-border bg-popover p-3 shadow-xl">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-rose-500/20">
              <Wrench className="h-3.5 w-3.5 text-rose-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Maintenance Zone</p>
              <p className="text-xs text-muted-foreground">{zone.id}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <p className="text-muted-foreground">Reason</p>
              <p className="font-medium text-foreground">{zone.reason}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Priority</p>
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                  zone.priority === "low" && "bg-amber-500/20 text-amber-400",
                  zone.priority === "medium" && "bg-orange-500/20 text-orange-400",
                  zone.priority === "high" && "bg-rose-500/20 text-rose-400",
                )}>
                  {zone.priority === "high" && <AlertCircle className="h-2.5 w-2.5" />}
                  {zone.priority}
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatTime(zone.startTime)} - {formatTime(zone.startTime + zone.duration)}</span>
              </div>
            </div>
          </div>

          <div className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-border" />
          <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-px border-8 border-transparent border-t-popover" />
        </div>
      )}
    </div>
  )
}
