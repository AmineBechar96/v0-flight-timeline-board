"use client"

import { useState, useCallback } from "react"
import type { Flight } from "@/lib/mock-flights"

const BUFFER_MINUTES = 15
const BUFFER_HOURS = BUFFER_MINUTES / 60

export interface DragState {
  isDragging: boolean
  draggedFlight: Flight | null
  targetStand: string | null
  hasConflict: boolean
  conflictingFlights: Flight[]
}

export interface ConflictResult {
  hasConflict: boolean
  conflictingFlights: Flight[]
}

export function checkConflict(
  draggedFlight: Flight,
  targetStand: string,
  allFlights: Flight[]
): ConflictResult {
  const dragStart = draggedFlight.startTime - BUFFER_HOURS
  const dragEnd = draggedFlight.startTime + draggedFlight.duration + BUFFER_HOURS

  const conflictingFlights = allFlights.filter((flight) => {
    // Skip the flight being dragged
    if (flight.id === draggedFlight.id) return false
    // Only check flights on the target stand
    if (flight.stand !== targetStand) return false

    const flightStart = flight.startTime
    const flightEnd = flight.startTime + flight.duration

    // Check for overlap (including buffer)
    return dragStart < flightEnd && dragEnd > flightStart
  })

  return {
    hasConflict: conflictingFlights.length > 0,
    conflictingFlights,
  }
}

export function useFlightDrag(flights: Flight[]) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedFlight: null,
    targetStand: null,
    hasConflict: false,
    conflictingFlights: [],
  })

  const startDrag = useCallback((flight: Flight) => {
    setDragState({
      isDragging: true,
      draggedFlight: flight,
      targetStand: null,
      hasConflict: false,
      conflictingFlights: [],
    })
  }, [])

  const updateTarget = useCallback(
    (targetStand: string | null) => {
      if (!dragState.draggedFlight || !targetStand) {
        setDragState((prev) => ({
          ...prev,
          targetStand: null,
          hasConflict: false,
          conflictingFlights: [],
        }))
        return
      }

      const result = checkConflict(dragState.draggedFlight, targetStand, flights)

      setDragState((prev) => ({
        ...prev,
        targetStand,
        hasConflict: result.hasConflict,
        conflictingFlights: result.conflictingFlights,
      }))
    },
    [dragState.draggedFlight, flights]
  )

  const endDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedFlight: null,
      targetStand: null,
      hasConflict: false,
      conflictingFlights: [],
    })
  }, [])

  return {
    dragState,
    startDrag,
    updateTarget,
    endDrag,
  }
}
