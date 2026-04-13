"use client"

import { useState } from "react"
import { Search, X, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import type { FlightType, FlightStatus, Airline, ConnectionType } from "@/lib/types"

const flightTypes: { value: FlightType; label: string }[] = [
  { value: "arrival", label: "Arrivals" },
  { value: "departure", label: "Departures" },
  { value: "turnaround", label: "Turnarounds" },
]

const dbConnectionTypes: { value: ConnectionType; label: string; color: string }[] = [
  { value: "quick", label: "Quick", color: "bg-emerald-500" },
  { value: "no_connection", label: "No Conn", color: "bg-slate-500" },
  { value: "critical", label: "Critical", color: "bg-red-500" },
  { value: "priority", label: "Priority", color: "bg-amber-500" },
]

const statusOptions: { value: FlightStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "boarding", label: "Boarding" },
  { value: "delayed", label: "Delayed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

export interface FilterState {
  search: string
  airlines: string[]
  flightTypes: FlightType[]
  dbConnectionTypes: ConnectionType[]
  statuses: FlightStatus[]
}

interface FilterControlsProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  airlines?: Airline[]
  onOpenCodesManagement?: () => void
}

export function FilterControls({ filters, onFiltersChange, airlines = [], onOpenCodesManagement }: FilterControlsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const activeFilterCount =
    filters.airlines.length +
    filters.flightTypes.length +
    filters.dbConnectionTypes.length +
    filters.statuses.length +
    (filters.search ? 1 : 0)

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
  }

  const toggleAirline = (code: string) => {
    const newAirlines = filters.airlines.includes(code)
      ? filters.airlines.filter((a) => a !== code)
      : [...filters.airlines, code]
    onFiltersChange({ ...filters, airlines: newAirlines })
  }

  const toggleFlightType = (type: FlightType) => {
    const newTypes = filters.flightTypes.includes(type)
      ? filters.flightTypes.filter((t) => t !== type)
      : [...filters.flightTypes, type]
    onFiltersChange({ ...filters, flightTypes: newTypes })
  }

  const toggleDbConnectionType = (type: ConnectionType) => {
    const newTypes = filters.dbConnectionTypes.includes(type)
      ? filters.dbConnectionTypes.filter((t) => t !== type)
      : [...filters.dbConnectionTypes, type]
    onFiltersChange({ ...filters, dbConnectionTypes: newTypes })
  }

  const toggleStatus = (status: FlightStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status]
    onFiltersChange({ ...filters, statuses: newStatuses })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      search: "",
      airlines: [],
      flightTypes: [],
      dbConnectionTypes: [],
      statuses: [],
    })
  }

  return (
    <div className="flex items-center gap-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search flights..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-8 w-48 bg-secondary pl-8 text-sm hover:cursor-pointer"
        />
        {filters.search && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Connection Type Filter (DB Connection Types) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 hover:cursor-pointer">
            Connection
            {filters.dbConnectionTypes.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {filters.dbConnectionTypes.length}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuLabel className="text-xs">Connection Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {dbConnectionTypes.map((type) => (
            <DropdownMenuCheckboxItem
              key={type.value}
              checked={filters.dbConnectionTypes.includes(type.value)}
              onCheckedChange={() => toggleDbConnectionType(type.value)}
            >
              <span className={`mr-2 h-2 w-2 rounded-full ${type.color}`} />
              {type.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Flight Type Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 hover:cursor-pointer">
            Flight Type
            {filters.flightTypes.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {filters.flightTypes.length}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuLabel className="text-xs">Flight Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {flightTypes.map((type) => (
            <DropdownMenuCheckboxItem
              key={type.value}
              checked={filters.flightTypes.includes(type.value)}
              onCheckedChange={() => toggleFlightType(type.value)}
            >
              {type.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 hover:cursor-pointer">
            Status
            {filters.statuses.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {filters.statuses.length}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {statusOptions.map((status) => (
            <DropdownMenuCheckboxItem
              key={status.value}
              checked={filters.statuses.includes(status.value)}
              onCheckedChange={() => toggleStatus(status.value)}
            >
              {status.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Airline Filter */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 hover:cursor-pointer">
            Airline
            {filters.airlines.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {filters.airlines.length}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-64 w-48 overflow-y-auto">
          <DropdownMenuLabel className="text-xs">Airlines</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {airlines.map((airline) => (
            <DropdownMenuCheckboxItem
              key={airline.iataCode}
              checked={filters.airlines.includes(airline.iataCode)}
              onCheckedChange={() => toggleAirline(airline.iataCode)}
            >
              <span className="mr-1 font-mono text-xs text-muted-foreground">{airline.iataCode}</span>
              {airline.fullName}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground hover:cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
          Clear ({activeFilterCount})
        </Button>
      )}

      {/* Codes Management Button */}
      {onOpenCodesManagement && (
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCodesManagement}
          className="h-8 gap-1.5 hover:cursor-pointer"
        >
          Codes
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}