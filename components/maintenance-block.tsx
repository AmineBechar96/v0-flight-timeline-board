"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"
import { Wrench, AlertCircle, Clock } from "lucide-react"
import type { MaintenanceZone } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MaintenanceBlockProps {
  zone: MaintenanceZone
  hourWidth: number
}

export function MaintenanceBlock({ zone, hourWidth }: MaintenanceBlockProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top')
  const [tooltipCoords, setTooltipCoords] = useState<{ top: number; left: number } | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

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

  // Calculate tooltip position and coordinates based on card position in viewport
  const calculateTooltipPosition = useCallback(() => {
    if (!cardRef.current) return { position: 'top' as const, coords: null }
    
    const rect = cardRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const tooltipWidth = 224 // Approximate tooltip width
    const tooltipHeight = 180 // Approximate tooltip height
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
    let left = rect.left + rect.width / 2 - 112 // Center the tooltip (224/2 = 112)
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

  // Tooltip content component
  const TooltipContent = () => (
    <div 
      ref={tooltipRef}
      className="fixed w-56 rounded-lg border border-border bg-popover p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: tooltipCoords?.top ?? 0,
        left: tooltipCoords?.left ?? 0,
        zIndex: 9999,
      }}
      onMouseEnter={handleTooltipMouseEnter}
      onMouseLeave={handleTooltipMouseLeave}
    >
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
        className="group absolute top-1 bottom-1 cursor-pointer"
        style={{ left: `${left}px`, width: `${width}px` }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={cn(
            "relative flex h-full items-center justify-center gap-1 overflow-hidden rounded border border-dashed text-[10px] font-medium transition-all",
            priorityStyles[zone.priority],
            "hover:scale-[1.02] hover:shadow-lg"
          )}
        >
          <Wrench className="h-3 w-3 text-rose-400" />
        </div>
      </div>
      
      {/* Render tooltip via Portal to escape stacking context */}
      {showTooltip && tooltipCoords && createPortal(
        <TooltipContent />,
        document.body
      )}
    </>
  )
}
