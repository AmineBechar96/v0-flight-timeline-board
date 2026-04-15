"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DatePickerCalendarProps {
  value: string
  onChange: (date: string) => void
  onClose: () => void
}

export function DatePickerCalendar({ value, onChange, onClose }: DatePickerCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = new Date(value + "T00:00:00")
    return { year: date.getFullYear(), month: date.getMonth() }
  })
  const [isClosing, setIsClosing] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  
  // Handle closing animation
  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 200)
  }

  const DAYS_OF_WEEK = ["lu", "ma", "me", "je", "ve", "sa", "di"]
  const MONTHS = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get first day of month (0 = Monday, 6 = Sunday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay()
    // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    return day === 0 ? 6 : day - 1
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const { year, month } = currentMonth
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const daysInPrevMonth = getDaysInMonth(year, month - 1)
    
    const days: { day: number; month: "prev" | "current" | "next"; date: string }[] = []
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i
      const pm = month === 0 ? 11 : month - 1
      const py = month === 0 ? year - 1 : year
      days.push({
        day: d,
        month: "prev",
        date: `${py}-${String(pm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      })
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: "current",
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`
      })
    }
    
    // Next month days to fill grid
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const nm = month === 11 ? 0 : month + 1
      const ny = month === 11 ? year + 1 : year
      days.push({
        day: i,
        month: "next",
        date: `${ny}-${String(nm + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`
      })
    }
    
    return days
  }

  // Check if date is today
  const isToday = (date: string) => {
    const today = new Date().toISOString().split("T")[0]
    return date === today
  }

  // Check if date is selected
  const isSelected = (date: string) => {
    return date === value
  }

  // Handle previous month
  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 }
      }
      return { year: prev.year, month: prev.month - 1 }
    })
  }

  // Handle next month
  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 }
      }
      return { year: prev.year, month: prev.month + 1 }
    })
  }

  // Handle date selection
  const handleDateSelect = (date: string) => {
    onChange(date)
    handleClose()
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const days = generateCalendarDays()

  return (
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        transition-all duration-200 ease-out
        ${isClosing ? "animate-out fade-out duration-200" : "animate-in fade-in duration-200"}
      `}
      style={{ backgroundColor: isClosing ? "rgba(0, 0, 0, 0)" : "rgba(0, 0, 0, 0.6)", backdropFilter: isClosing ? "blur(0px)" : "blur(4px)" }}
    >
      <div 
        ref={calendarRef}
        className={`
          relative overflow-hidden
          transition-all duration-200 ease-out
          ${isClosing ? "animate-out zoom-out-95 duration-200" : "animate-in zoom-in-95 duration-200"}
        `}
        style={{
          backgroundColor: "#1F1F1F",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Ambient glow effect */}
        <div 
          className="absolute pointer-events-none"
          style={{
            top: "-50%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "200px",
            height: "200px",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg transition-all duration-150 hover:bg-white/10 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 text-white/60" />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xl font-semibold text-white tracking-tight">
                {MONTHS[currentMonth.month]} {currentMonth.year}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg transition-all duration-150 hover:bg-white/10 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4 text-white/60" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map(day => (
              <div 
                key={day} 
                className="text-center text-xs font-medium py-2"
                style={{ color: "rgba(255, 255, 255, 0.35)" }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => (
              <button
                key={i}
                onClick={() => handleDateSelect(d.date)}
                className={`
                  relative w-10 h-10 rounded-full flex items-center justify-center text-sm 
                  transition-all duration-150 ease-out cursor-pointer
                  ${d.month === "prev" || d.month === "next" ? "opacity-25" : "opacity-100"}
                  active:scale-90
                  hover:bg-white/10
                `}
                style={{
                  color: isSelected(d.date) ? "white" : "rgba(255, 255, 255, 0.85)",
                }}
              >
                {/* Today indicator */}
                {isToday(d.date) && !isSelected(d.date) && (
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(79, 70, 229, 0.25) 100%)",
                      boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
                    }}
                  />
                )}
                
                {/* Selected indicator */}
                {isSelected(d.date) && (
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      boxShadow: "0 4px 15px rgba(99, 102, 241, 0.5)",
                    }}
                  />
                )}
                
                <span className="relative z-10 font-medium">{d.day}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
