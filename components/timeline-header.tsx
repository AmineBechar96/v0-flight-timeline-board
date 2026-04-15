"use client"

import { useState, useEffect } from "react"
import { Plane, Clock, CalendarDays, Filter, RefreshCw, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePickerCalendar } from "@/components/date-picker-calendar"
import { AllocationModeSwitcher, AllocationMode } from "@/components/allocation-mode-switcher"

interface TimelineHeaderProps {
  totalFlights: number
  activeFlights: number
  maintenanceZones: number
  onRefresh: () => void
  selectedDate?: string
  onPreviousDay?: () => void
  onNextDay?: () => void
  onToday?: () => void
  onDateChange?: (date: string) => void
  allocationMode?: AllocationMode
  onAllocationModeChange?: (mode: AllocationMode) => void
}

export function TimelineHeader({ totalFlights, activeFlights, maintenanceZones, onRefresh, selectedDate, onPreviousDay, onNextDay, onToday, onDateChange, allocationMode = "manual", onAllocationModeChange }: TimelineHeaderProps) {
  const [mounted, setMounted] = useState(false)
  const [formattedDate, setFormattedDate] = useState("---")
  const [formattedTime, setFormattedTime] = useState("--:--")
  const [showCalendar, setShowCalendar] = useState(false)

  // Handle date input click
  const handleDateClick = () => {
    setShowCalendar(true)
  }

  // Handle date change from picker
  const handleDateChange = (date: string) => {
    if (onDateChange) {
      onDateChange(date)
    }
  }

  // Format the selected date for display with month, day, and year
  const formatSelectedDate = (dateStr: string) => {
    if (!dateStr) return "---"
    const date = new Date(dateStr + "T00:00:00")
    
    // Get day with ordinal suffix (1st, 2nd, 3rd, etc.)
    const day = date.getDate()
    const ordinalSuffix = getOrdinalSuffix(day)
    
    // Get month name
    const monthName = date.toLocaleDateString("en-US", { month: "long" })
    
    // Get year
    const year = date.getFullYear()
    
    return `${monthName} ${day}${ordinalSuffix}, ${year}`
  }

  // Get ordinal suffix for day
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return "th"
    switch (day % 10) {
      case 1: return "st"
      case 2: return "nd"
      case 3: return "rd"
      default: return "th"
    }
  }

  // Check if selected date is today
  const isToday = selectedDate === new Date().toISOString().split("T")[0]

  useEffect(() => {
    setMounted(true)
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

          <div className="ml-8 flex items-center gap-2 border-l border-border pl-6">
            {/* Date Navigation */}
            {selectedDate && (
              <div className="flex items-center">
                <button
                  onClick={onPreviousDay}
                  className="p-1.5 hover:bg-muted rounded-md transition-colors cursor-pointer"
                  title="Previous day"
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                
                {/* Clickable Date Display */}
                <div 
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted rounded-md cursor-pointer transition-colors mx-1"
                  onClick={handleDateClick}
                  title="Click to pick a date"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {formatSelectedDate(selectedDate)}
                  </span>
                </div>

                <button
                  onClick={onNextDay}
                  className="p-1.5 hover:bg-muted rounded-md transition-colors cursor-pointer"
                  title="Next day"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                
                {!isToday && onToday && (
                  <button
                    onClick={onToday}
                    className="ml-2 text-xs text-primary hover:underline"
                  >
                    Today
                  </button>
                )}
              </div>
            )}
            
            {/* Custom Calendar Picker */}
            {showCalendar && selectedDate && (
              <DatePickerCalendar
                value={selectedDate}
                onChange={handleDateChange}
                onClose={() => setShowCalendar(false)}
              />
            )}

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-foreground">{mounted ? formattedTime : "--:--"}</span>
            </div>

            {/* Allocation Mode Switcher */}
            <div className="ml-4">
              <AllocationModeSwitcher
                mode={allocationMode}
                onModeChange={onAllocationModeChange || (() => {})}
              />
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
            <Button variant="outline" size="sm" className="gap-2 hover:cursor-pointer">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2 hover:cursor-pointer" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
