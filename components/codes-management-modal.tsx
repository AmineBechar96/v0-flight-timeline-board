"use client"

import { useState, useEffect } from "react"
import {
  X,
  Layers,
  Plane,
  ChevronDown,
  Search,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useStandData } from "@/hooks/use-stand-data"
import { supabase } from "@/lib/supabase"

interface CodesManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

interface AircraftType {
  aircraft_type: string
}

interface CodeAircraftType {
  code_id: string
  aircraft_type: string
}

export function CodesManagementModal({ isOpen, onClose }: CodesManagementModalProps) {
  const { codes: contextCodes, airplanes, codeAircraftTypes, isLoading: isLoadingContext } = useStandData()
  
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({})
  const [suggestions, setSuggestions] = useState<Record<string, AircraftType[]>>({})

  useEffect(() => {
    if (isOpen) {
      setSelectedCode(null)
      setSearchTerms({})
      setSuggestions({})
    }
  }, [isOpen])

  const getAircraftsByCode = (codeId: string) => {
    return codeAircraftTypes.filter((a: CodeAircraftType) => a.code_id === codeId)
  }

  const getUnassignedAircrafts = (codeId: string) => {
    const assignedTypes = codeAircraftTypes
      .filter((a: CodeAircraftType) => a.code_id === codeId)
      .map((a: CodeAircraftType) => a.aircraft_type)
    return airplanes.filter((a) => !assignedTypes.includes(a.aircraft_type))
  }

  const handleSearch = (codeId: string, value: string) => {
    setSearchTerms(prev => ({ ...prev, [codeId]: value }))
    
    if (value.trim()) {
      const unassigned = getUnassignedAircrafts(codeId)
      const filtered = unassigned.filter(a => 
        a.aircraft_type.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(prev => ({ ...prev, [codeId]: filtered.slice(0, 5) }))
    } else {
      setSuggestions(prev => ({ ...prev, [codeId]: [] }))
    }
  }

  const handleAddAircraft = async (codeId: string, aircraftType: string) => {
    await supabase
      .from("code_aircraft_types")
      .insert({ code_id: codeId, aircraft_type: aircraftType })
  }

  const handleRemoveAircraft = async (codeId: string, aircraftType: string) => {
    await supabase
      .from("code_aircraft_types")
      .delete()
      .eq("code_id", codeId)
      .eq("aircraft_type", aircraftType)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: "0.5s" }} />
        </div>

        <DialogHeader className="relative z-10 flex flex-col items-center text-center mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg mb-2">
            <Layers className="h-6 w-6 text-primary animate-[pulse_2s_ease-in-out]" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
              Codes Management
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Manage codes and view aircraft types
            </DialogDescription>
          </div>
        </DialogHeader>

        <form className="relative z-10 space-y-6">
          <div className="space-y-5">
            <div className="group relative">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary/10">
                  <Layers className="h-3 w-3 text-primary" />
                </span>
                Code
              </label>
              
              {isLoadingContext ? (
                <div className="flex items-center justify-center h-12 rounded-md border border-input bg-muted/30">
                  <span className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : contextCodes.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {contextCodes.map((code) => {
                    const aircrafts = getAircraftsByCode(code.id)
                    const codeSuggestions = suggestions[code.id] || []
                    
                    return (
                      <DropdownMenu key={code.id}>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={`relative h-10 rounded-lg border text-sm font-medium transition-all duration-200 hover:cursor-pointer ${
                              selectedCode === code.id
                                ? "bg-primary/20 border-primary text-primary shadow-md"
                                : "bg-card border-input hover:border-primary/50 hover:bg-primary/5"
                            }`}
                          >
                            <span className="relative z-10">{code.id}</span>
                            <ChevronDown className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                          <div className="p-2 space-y-3">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                type="text"
                                placeholder="Search aircraft..."
                                value={searchTerms[code.id] || ""}
                                onChange={(e) => handleSearch(code.id, e.target.value)}
                                className="h-8 pl-8 text-xs"
                              />
                              {codeSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-32 overflow-y-auto">
                                  {codeSuggestions.map((suggestion) => (
                                    <button
                                      key={suggestion.aircraft_type}
                                      type="button"
                                      onClick={() => handleAddAircraft(code.id, suggestion.aircraft_type)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 text-left hover:cursor-pointer"
                                    >
                                      <Plane className="h-3.5 w-3.5 text-primary" />
                                      {suggestion.aircraft_type}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Aircrafts ({aircrafts.length})</p>
                              {aircrafts.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic py-2">No aircrafts</p>
                              ) : (
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {aircrafts.map((aircraft: CodeAircraftType, index: number) => (
                                    <div
                                      key={`${aircraft.code_id}-${aircraft.aircraft_type}-${index}`}
                                      className="flex items-center justify-between gap-2 px-2 py-1.5 bg-muted/30 rounded text-sm"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Plane className="h-3.5 w-3.5 text-primary" />
                                        <span className="font-medium">{aircraft.aircraft_type}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveAircraft(aircraft.code_id, aircraft.aircraft_type)}
                                        className="flex items-center justify-center h-5 w-5 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/40 transition-colors hover:cursor-pointer"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No codes available</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 transition-all duration-200 hover:bg-destructive/10 hover:cursor-pointer"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </form>

        <div className="relative z-10 flex items-center justify-center gap-2 pt-4 border-t">
          <span className="h-1 w-1 rounded-full bg-primary/50 animate-pulse" />
          <span className="h-1 w-1 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "0.2s" }} />
          <span className="h-1 w-1 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
