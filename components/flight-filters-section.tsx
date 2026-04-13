"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Plane, Plus, Minus, X, Search } from "lucide-react"
import {
  fetchStandCodeFilters,
  addStandCodeFilter,
  removeStandCodeFilter,
  fetchCodeAircraftTypes,
} from "@/lib/data"
import type { StandCodeFilter } from "@/lib/types"

interface FlightFiltersSectionProps {
  standId: string
  codeId: string
}

export function FlightFiltersSection({ standId, codeId }: FlightFiltersSectionProps) {
  const [filters, setFilters] = useState<StandCodeFilter[]>([])
  const [codeAircraftTypes, setCodeAircraftTypes] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [activeSearch, setActiveSearch] = useState<"add" | "remove" | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const searchBoxRef = useRef<HTMLDivElement>(null)

  // Fetch filters and code aircraft types on mount/standId change
  useEffect(() => {
    if (!standId) return

    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        console.log("Fetching data for stand:", standId)
        const [filtersData, aircraftTypesData] = await Promise.all([
          fetchStandCodeFilters(standId),
          fetchCodeAircraftTypes(),
        ])
        console.log("Filters loaded:", filtersData)
        console.log("Code aircraft types:", aircraftTypesData)
        setFilters(filtersData)
        setCodeAircraftTypes(aircraftTypesData)
      } catch (err) {
        console.error("Error loading flight filters:", err)
        setError("Failed to load filters")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [standId])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        activeSearch &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setActiveSearch(null)
        setSearchTerm("")
      }
    }

    if (activeSearch) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [activeSearch])

  // Separate added and removed filters
  const addedFilters = useMemo(
    () => filters.filter((f) => f.operation === "add"),
    [filters]
  )
  const removedFilters = useMemo(
    () => filters.filter((f) => f.operation === "remove"),
    [filters]
  )

  // Get aircraft types that already have filters
  const filteredTypes = useMemo(() => {
    return new Set(filters.map((f) => f.aircraft_type))
  }, [filters])

  // Get all available aircraft types
  const allTypes = useMemo(() => {
    const types = new Set<string>()
    for (const aircraftTypes of Object.values(codeAircraftTypes)) {
      for (const t of aircraftTypes) {
        types.add(t)
      }
    }
    return Array.from(types).sort()
  }, [codeAircraftTypes])

  // For "Add" dropdown: aircraft types from OTHER codes
  const addAvailableTypes = useMemo(() => {
    if (!codeId) return []
    const otherTypes = new Set<string>()
    for (const [code, aircraftTypes] of Object.entries(codeAircraftTypes)) {
      if (code !== codeId) {
        for (const t of aircraftTypes) {
          otherTypes.add(t)
        }
      }
    }
    return allTypes.filter(t => otherTypes.has(t) && !filteredTypes.has(t))
  }, [codeAircraftTypes, codeId, allTypes, filteredTypes])

  // For "Remove" dropdown: aircraft types from THIS code
  const removeAvailableTypes = useMemo(() => {
    if (!codeId) return []
    const thisTypes = new Set(codeAircraftTypes[codeId] || [])
    return allTypes.filter(t => thisTypes.has(t) && !filteredTypes.has(t))
  }, [codeAircraftTypes, codeId, allTypes, filteredTypes])

  // Filter by search term
  const filteredAddTypes = useMemo(() => {
    if (!searchTerm) return addAvailableTypes
    return addAvailableTypes.filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [addAvailableTypes, searchTerm])

  const filteredRemoveTypes = useMemo(() => {
    if (!searchTerm) return removeAvailableTypes
    return removeAvailableTypes.filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [removeAvailableTypes, searchTerm])

  const handleAddType = async (aircraftType: string) => {
    if (!standId) return

    console.log("Adding type:", aircraftType)
    const success = await addStandCodeFilter(standId, "add", aircraftType)
    if (success) {
      setFilters((prev) => [
        ...prev,
        {
          stand_id: standId,
          operation: "add",
          aircraft_type: aircraftType,
        },
      ])
    }
    setActiveSearch(null)
    setSearchTerm("")
  }

  const handleRemoveType = async (aircraftType: string) => {
    if (!standId) return

    console.log("Removing type:", aircraftType)
    const success = await addStandCodeFilter(standId, "remove", aircraftType)
    if (success) {
      setFilters((prev) => [
        ...prev,
        {
          stand_id: standId,
          operation: "remove",
          aircraft_type: aircraftType,
        },
      ])
    }
    setActiveSearch(null)
    setSearchTerm("")
  }

  const handleDeleteFilter = async (filter: StandCodeFilter, index: number) => {
    console.log("Deleting filter:", filter)
    if (filter.id) {
      const success = await removeStandCodeFilter(filter.id)
      if (success) {
        setFilters((prev) => prev.filter((_, i) => i !== index))
      }
    } else {
      setFilters((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const toggleSearch = (type: "add" | "remove") => {
    if (activeSearch === type) {
      setActiveSearch(null)
      setSearchTerm("")
    } else {
      setActiveSearch(type)
      setSearchTerm("")
    }
  }

  if (!standId) return null

  return (
    <div className="group relative" ref={containerRef}>
      <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary/10">
          <Plane className="h-3 w-3 text-primary" />
        </span>
        Flight Filters
      </label>

      {isLoading ? (
        <div className="flex items-center justify-center h-8 rounded-md border border-input bg-muted/30">
          <span className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="text-xs text-destructive">{error}</div>
      ) : (
        <div className="space-y-3">
          {/* Two buttons side by side */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toggleSearch("add")}
              disabled={!codeId}
              className={`flex-1 h-9 rounded-lg border font-medium text-sm transition-all cursor-pointer ${
                activeSearch === "add"
                  ? "bg-emerald-500 border-emerald-400 text-white"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              } ${!codeId ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className="flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                Add
              </span>
            </button>
            
            <button
              type="button"
              onClick={() => toggleSearch("remove")}
              disabled={!codeId}
              className={`flex-1 h-9 rounded-lg border font-medium text-sm transition-all cursor-pointer ${
                activeSearch === "remove"
                  ? "bg-red-500 border-red-400 text-white"
                  : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
              } ${!codeId ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className="flex items-center justify-center gap-2">
                <Minus className="h-4 w-4" />
                Remove
              </span>
            </button>
          </div>

          {/* Search input */}
          {activeSearch && (
            <div ref={searchBoxRef} className={`rounded-lg border shadow-lg overflow-hidden ${
              activeSearch === "add" 
                ? "border-emerald-500/60 bg-zinc-900" 
                : "border-red-500/60 bg-zinc-900"
            }`}>
              <div className={`flex items-center gap-2 px-3 py-2 ${
                activeSearch === "add" ? "border-b border-emerald-500/30" : "border-b border-red-500/30"
              }`}>
                <Search className={`h-4 w-4 ${
                  activeSearch === "add" ? "text-emerald-400" : "text-red-400"
                }`} />
                <input
                  type="text"
                  placeholder="Search aircraft types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                  autoFocus
                />
              </div>
              <div className="max-h-16 overflow-y-auto scrollbar-thin">
                {activeSearch === "add" ? (
                  filteredAddTypes.length === 0 ? (
                    <p className="p-3 text-xs text-zinc-500">No types from other codes</p>
                  ) : (
                    filteredAddTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleAddType(type)}
                        className="flex w-full items-center px-3 py-2 text-sm text-zinc-200 hover:bg-emerald-500/20 transition-colors"
                      >
                        <span className="font-mono font-medium">{type}</span>
                      </button>
                    ))
                  )
                ) : (
                  filteredRemoveTypes.length === 0 ? (
                    <p className="p-3 text-xs text-zinc-500">No types from this code</p>
                  ) : (
                    filteredRemoveTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleRemoveType(type)}
                        className="flex w-full items-center px-3 py-2 text-sm text-zinc-200 hover:bg-red-500/20 transition-colors"
                      >
                        <span className="font-mono font-medium">{type}</span>
                      </button>
                    ))
                  )
                )}
              </div>
            </div>
          )}

          {/* Added (green) chips */}
          {addedFilters.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {addedFilters.map((filter, idx) => (
                <span
                  key={`add-${idx}`}
                  className="inline-flex items-center gap-1 rounded border bg-emerald-500/15 border-emerald-500/30 px-2 py-0.5 text-xs font-medium text-emerald-400"
                >
                  {filter.aircraft_type}
                  <button
                    type="button"
                    onClick={() => handleDeleteFilter(filter, filters.indexOf(filter))}
                    className="hover:text-emerald-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Removed (red) chips */}
          {removedFilters.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {removedFilters.map((filter, idx) => (
                <span
                  key={`remove-${idx}`}
                  className="inline-flex items-center gap-1 rounded border bg-red-500/15 border-red-500/30 px-2 py-0.5 text-xs font-medium text-red-400"
                >
                  {filter.aircraft_type}
                  <button
                    type="button"
                    onClick={() => handleDeleteFilter(filter, filters.indexOf(filter))}
                    className="hover:text-red-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}