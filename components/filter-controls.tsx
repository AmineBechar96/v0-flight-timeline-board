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
import type { FlightType, FlightStatus, Airline } from "@/lib/types"

const connectionTypes: { value: FlightType; label: string }[] = [
  { value: "arrival", label: "Arrivals" },
  { value: "departure", label: "Departures" },
  { value: "turnaround", label: "Turnarounds" },
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
  connectionTypes: FlightType[]
  statuses: FlightStatus[]
}

interface FilterControlsProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  airlines?: Airline[]
}

export function FilterControls({ filters, onFiltersChange, airlines = [] }: FilterControlsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const activeFilterCount =
    filters.airlines.length +
    filters.connectionTypes.length +
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

  const toggleConnectionType = (type: FlightType) => {
    const newTypes = filters.connectionTypes.includes(type)
      ? filters.connectionTypes.filter((t) => t !== type)
      : [...filters.connectionTypes, type]
    onFiltersChange({ ...filters, connectionTypes: newTypes })
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
      connectionTypes: [],
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
          className="h-8 w-48 bg-secondary pl-8 text-sm"
        />
        {filters.search && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Connection Type Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            Connection
            {filters.connectionTypes.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {filters.connectionTypes.length}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuLabel className="text-xs">Flight Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {connectionTypes.map((type) => (
            <DropdownMenuCheckboxItem
              key={type.value}
              checked={filters.connectionTypes.includes(type.value)}
              onCheckedChange={() => toggleConnectionType(type.value)}
            >
              {type.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
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
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
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
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Clear ({activeFilterCount})
        </Button>
      )}
    </div>
  )
}
