"use client"

import { useState } from "react"
import { PlaneLanding, PlaneTakeoff, ArrowLeftRight, Users, Clock, AlertTriangle, GripVertical } from "lucide-react"
import type { Flight } from "@/lib/types"
import { airlineColors, typeColors, statusColors } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FlightBlockProps {
  flight: Flight
  hourWidth: number
  onSelect?: (flight: Flight) => void
  isDragging?: boolean
  isConflicting?: boolean
  onDragStart?: (flight: Flight) => void
  onDragEnd?: () => void
}

export function FlightBlock({
  flight,
  hourWidth,
  onSelect,
  isDragging,
  isConflicting,
  onDragStart,
  onDragEnd,
}: FlightBlockProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const left = flight.startTime * hourWidth
  const width = Math.max(flight.duration * hourWidth, 40)
  const airlineColor = airlineColors[flight.airlineCode] || "bg-gray-600 border-gray-400"
  const typeColor = typeColors[flight.type]
  const statusStyle = statusColors[flight.status]

  const TypeIcon = {
    arrival: PlaneLanding,
    departure: PlaneTakeoff,
    turnaround: ArrowLeftRight,
  }[flight.type]

  const formatTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify(flight))
    e.dataTransfer.effectAllowed = "move"
    onDragStart?.(flight)
  }

  const handleDragEnd = () => {
    onDragEnd?.()
  }

  return (
    <div
      className={cn(
        "group absolute top-1 bottom-1 hover:cursor-pointer active:cursor-grabbing",
        isDragging && "opacity-50 scale-95",
        isConflicting && "ring-2 ring-red-500 ring-offset-1 ring-offset-background animate-pulse"
      )}
      style={{ left: `${left}px`, width: `${width}px` }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => onSelect?.(flight)}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          "relative flex h-full items-center gap-1 overflow-hidden rounded border-l-4 px-2 text-[10px] font-medium text-white transition-all",
          airlineColor,
          typeColor,
          statusStyle,
          "hover:scale-[1.02] hover:shadow-lg hover:z-10",
          isConflicting && "bg-red-600 border-red-400"
        )}
      >
        <div className="flex items-center gap-1 flex-1">
          <GripVertical className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
          <TypeIcon className="h-3 w-3 shrink-0" />
          <span className="truncate font-semibold">{flight.flightNumber}</span>
          {flight.status === "delayed" && <AlertTriangle className="h-3 w-3 shrink-0 text-amber-300" />}
        </div>

        {/* Delay badge on right edge - full height strong red */}
        {flight.delayMinutes && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-600 min-w-[32px] px-1 rounded-r border-l-2 border-red-800 shadow-lg">
            <span className="text-white text-[11px] font-bold">
              {flight.delayMinutes}
            </span>
          </div>
        )}
      </div>

      {showTooltip && !isDragging && (
        <div className="absolute left-1/2 bottom-full z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-popover p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("h-6 w-6 rounded flex items-center justify-center", airlineColor.split(" ")[0])}>
                <TypeIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{flight.flightNumber}</p>
                <p className="text-xs text-muted-foreground">{flight.airline}</p>
              </div>
            </div>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
              flight.status === "scheduled" && "bg-blue-500/20 text-blue-400",
              flight.status === "boarding" && "bg-emerald-500/20 text-emerald-400",
              flight.status === "delayed" && "bg-amber-500/20 text-amber-400",
              flight.status === "completed" && "bg-muted text-muted-foreground",
              flight.status === "cancelled" && "bg-red-500/20 text-red-400",
            )}>
              {flight.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Aircraft</p>
              <p className="font-medium text-foreground">{flight.aircraftType} · {flight.registration}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Stand</p>
              <p className="font-medium text-foreground">{flight.stand}</p>
            </div>
            {flight.origin && (
              <div>
                <p className="text-muted-foreground">Origin</p>
                <p className="font-medium text-foreground">{flight.origin}</p>
              </div>
            )}
            {flight.destination && (
              <div>
                <p className="text-muted-foreground">Destination</p>
                <p className="font-medium text-foreground">{flight.destination}</p>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatTime(flight.startTime)} - {formatTime(flight.startTime + flight.duration)}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{flight.passengers} pax</span>
            </div>
          </div>

          {flight.delayMinutes && (
            <div className="mt-2 flex items-center gap-2 rounded bg-red-600/20 px-2 py-1.5 text-xs border border-red-600/30">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <span className="font-bold text-red-500">
                Delayed: +{flight.delayMinutes >= 60 
                  ? `${Math.floor(flight.delayMinutes / 60)}h ${flight.delayMinutes % 60}min` 
                  : `${flight.delayMinutes} min`}
              </span>
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">Drag to reassign stand</p>
          </div>

          <div className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-border" />
          <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-px border-8 border-transparent border-t-popover" />
        </div>
      )}
    </div>
  )
}
