"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { fetchCodes, fetchAirplanes } from "@/lib/data"
import { supabase } from "@/lib/supabase"

interface CodeOption {
  id: string
  name: string
}

interface AirplaneOption {
  id: string
  registration: string
  aircraft_type: string
  code_id?: string
}

interface CodeAircraftType {
  code_id: string
  aircraft_type: string
}

interface StandDataContextType {
  codes: CodeOption[]
  airplanes: AirplaneOption[]
  codeAircraftTypes: CodeAircraftType[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const StandDataContext = createContext<StandDataContextType | null>(null)

export function StandDataProvider({ children }: { children: ReactNode }) {
  const [codes, setCodes] = useState<CodeOption[]>([])
  const [airplanes, setAirplanes] = useState<AirplaneOption[]>([])
  const [codeAircraftTypes, setCodeAircraftTypes] = useState<CodeAircraftType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch all reference data in parallel
      const [codesData, airplanesData, aircraftTypesData] = await Promise.all([
        fetchCodes(),
        fetchAirplanes(),
        supabase.from("code_aircraft_types").select("*"),
      ])
      
      setCodes(codesData)
      setAirplanes(airplanesData)
      setCodeAircraftTypes(aircraftTypesData.data || [])
    } catch (err) {
      console.error("Error loading stand data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  // Refresh on window focus (for admin changes mid-session)
  useEffect(() => {
    const handleFocus = () => {
      // Only refresh if we have data already (avoid blocking initial load)
      if (!isLoading && codes.length > 0) {
        loadData()
      }
    }
    
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [loadData, isLoading, codes.length])

  // Background refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadData()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [loadData])

  const value: StandDataContextType = {
    codes,
    airplanes,
    codeAircraftTypes,
    isLoading,
    error,
    refresh: loadData,
  }

  return (
    <StandDataContext.Provider value={value}>
      {children}
    </StandDataContext.Provider>
  )
}

export function useStandData() {
  const context = useContext(StandDataContext)
  if (!context) {
    throw new Error("useStandData must be used within a StandDataProvider")
  }
  return context
}
