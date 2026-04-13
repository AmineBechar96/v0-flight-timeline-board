"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"
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
  const [isHovering, setIsHovering] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top')
  const [tooltipCoords, setTooltipCoords] = useState<{ top: number; left: number } | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

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

  // Calculate tooltip position and coordinates based on card position in viewport
  const calculateTooltipPosition = useCallback(() => {
    if (!cardRef.current) return { position: 'top' as const, coords: null }
    
    const rect = cardRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const tooltipWidth = 280 // Approximate tooltip width
    const tooltipHeight = 280 // Approximate tooltip height
    const margin = 8
    
    const spaceAbove = rect.top
    const spaceBelow = viewportHeight - rect.bottom
    
    // Determine vertical position
    let position: 'top' | 'bottom'
    let top: number
    
    if (spaceAbove < tooltipHeight && spaceBelow > tooltipHeight) {
      // Not enough space above, flip to bottom
      position = 'bottom'
      top = rect.bottom + margin
    } else {
      // Default to top
      position = 'top'
      top = rect.top - tooltipHeight - margin
    }
    
    // Calculate horizontal position (centered with viewport bounds)
    let left = rect.left + rect.width / 2 - 140 // Center the tooltip (280/2 = 140)
    // Keep within viewport bounds
    left = Math.max(margin, Math.min(left, viewportWidth - tooltipWidth - margin))
    
    return { position, coords: { top, left } }
  }, [])

  const handleMouseEnter = useCallback(() => {
    // Clear any pending leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    
    // Set hovering state
    setIsHovering(true)
    
    // Add delay before showing tooltip
    hoverTimeoutRef.current = setTimeout(() => {
      const { position, coords } = calculateTooltipPosition()
      setTooltipPosition(position)
      setTooltipCoords(coords)
      setShowTooltip(true)
    }, 150)
  }, [calculateTooltipPosition])

  const handleMouseLeave = useCallback(() => {
    // Clear any pending hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    
    setIsHovering(false)
    
    // Delay hiding to allow moving to tooltip
    leaveTimeoutRef.current = setTimeout(() => {
      // Check if we're actually leaving (not hovering the tooltip)
      if (tooltipRef.current && tooltipRef.current.matches(':hover')) {
        return
      }
      setShowTooltip(false)
      setTooltipCoords(null)
    }, 100)
  }, [])

  const handleTooltipMouseEnter = useCallback(() => {
    // Clear any pending leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    setIsHovering(true)
  }, [])

  const handleTooltipMouseLeave = useCallback(() => {
    leaveTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false)
      setTooltipCoords(null)
      setIsHovering(false)
    }, 100)
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
      }
    }
  }, [])

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify(flight))
    e.dataTransfer.effectAllowed = "move"
    onDragStart?.(flight)
    // Hide tooltip when dragging starts
    setShowTooltip(false)
    setTooltipCoords(null)
  }

  const handleDragEnd = () => {
    onDragEnd?.()
  }

  // Tooltip content component
  const TooltipContent = () => (
    <div 
      ref={tooltipRef}
      className="fixed w-64 rounded-lg border border-border bg-popover p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: tooltipCoords?.top ?? 0,
        left: tooltipCoords?.left ?? 0,
        zIndex: 9999,
      }}
      onMouseEnter={handleTooltipMouseEnter}
      onMouseLeave={handleTooltipMouseLeave}
    >
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

      {/* Only show drag hint when NOT dragging */}
      {!isDragging && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">Drag to reassign stand</p>
        </div>
      )}

      {/* Arrow pointer */}
      <div 
        className={cn(
          "absolute left-1/2 -translate-x-1/2 border-8 border-transparent",
          tooltipPosition === 'top' ? "-bottom-4 border-t-popover" : "-top-4 border-b-popover"
        )}
      />
    </div>
  )

  return (
    <>
      <div
        ref={cardRef}
        className={cn(
          "group absolute top-1 bottom-1 hover:cursor-pointer active:cursor-grabbing",
          isDragging && "opacity-50 scale-95",
          isConflicting && "ring-2 ring-red-500 ring-offset-1 ring-offset-background animate-pulse"
        )}
        style={{ left: `${left}px`, width: `${width}px` }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
            "hover:scale-[1.02] hover:shadow-lg",
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
      </div>
      
      {/* Render tooltip via Portal to escape stacking context */}
      {showTooltip && !isDragging && tooltipCoords && createPortal(
        <TooltipContent />,
        document.body
      )}
    </>
  )
}
