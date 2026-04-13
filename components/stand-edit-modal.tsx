"use client"

import { useState, useEffect } from "react"
import {
  Plane,
  Tag,
  X,
  Check,
  MapPin,
  Gauge,
  Layers,
  ChevronDown,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useStandData } from "@/hooks/use-stand-data"

interface StandEditModalProps {
  isOpen: boolean
  onClose: () => void
  standId?: string
  currentZoneId?: string
  currentCodeId?: string
  currentAirplanes?: string
  currentActive?: boolean
  onSave: (data: { zoneId: string; codeId: string; airplanes: string; active: boolean }) => void
}

export function StandEditModal({
  isOpen,
  onClose,
  standId,
  currentZoneId = "",
  currentCodeId = "",
  currentAirplanes = "",
  currentActive = true,
  onSave,
}: StandEditModalProps) {
  const { codes, airplanes, isLoading: isLoadingContext } = useStandData()
  
  const [zoneId, setZoneId] = useState(currentZoneId)
  const [codeId, setCodeId] = useState(currentCodeId)
  const [active, setActive] = useState(currentActive)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAirplaneIds, setSelectedAirplaneIds] = useState<string[]>([])
  const [formErrors, setFormErrors] = useState<{ code?: string; airplanes?: string }>({})

  // Reset form values when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoneId(currentZoneId)
      setCodeId(currentCodeId)
      setActive(currentActive)
      setFormErrors({})
      
      if (currentCodeId && currentAirplanes) {
        setSelectedAirplaneIds(currentAirplanes.split(",").map(s => s.trim()).filter(Boolean))
      } else {
        setSelectedAirplaneIds([])
      }
    }
  }, [isOpen, currentZoneId, currentCodeId, currentAirplanes, currentActive])

  // Reset selected airplanes when the code changes (unless it's matching the initial currentCodeId)
  useEffect(() => {
    if (isOpen) {
      if (codeId === currentCodeId && currentAirplanes) {
        setSelectedAirplaneIds(currentAirplanes.split(",").map(s => s.trim()).filter(Boolean))
      } else if (codeId !== currentCodeId) {
        // Clear selection when code changes (unless resetting to current)
        setSelectedAirplaneIds([])
      }
    }
  }, [codeId, isOpen, currentCodeId, currentAirplanes])

  // Compute filtered airplanes based on the selected code
  const airplaneList = airplanes.filter(a => !codeId || a.code_id === codeId)

  const validateForm = () => {
    const errors: { code?: string; airplanes?: string } = {}
    
    if (!codeId.trim()) {
      errors.code = "Please select a code"
    }
    
    if (selectedAirplaneIds.length === 0) {
      errors.airplanes = "Please select at least one aircraft"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    // Simulate save delay for animation
    await new Promise(resolve => setTimeout(resolve, 300))
    
    onSave({
      zoneId: zoneId.trim(),
      codeId: codeId.trim(),
      airplanes: selectedAirplaneIds.join(", "),
      active,
    })
    
    setIsSubmitting(false)
    onClose()
  }

  const handleClose = () => {
    setZoneId(currentZoneId)
    setCodeId(currentCodeId)
    setActive(currentActive)
    setFormErrors({})
    onClose()
  }

  const getCodeName = (id: string) => codes.find(c => c.id === id)?.name || id

  const toggleAirplane = (registration: string) => {
    setSelectedAirplaneIds(prev => 
      prev.includes(registration) ? prev.filter(a => a !== registration) : [...prev, registration]
    )
    setFormErrors(prev => ({ ...prev, airplanes: undefined }))
  }

  const airplaneDisplayText = selectedAirplaneIds.length === 0 
    ? "Select aircrafts..."
    : selectedAirplaneIds.length === 1 
      ? selectedAirplaneIds[0]
      : `${selectedAirplaneIds.length} aircrafts selected`

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Animated background gradient */}
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: "0.5s" }} />
        </div>

        <DialogHeader className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg">
              <MapPin className="h-6 w-6 text-primary animate-[pulse_2s_ease-in-out]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                Edit Stand
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {standId ? `Editing stand ${standId}` : "Creating new stand"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          {/* Form Fields */}
          <div className="space-y-5">
            {/* Zone Display */}
            <div className="group relative">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary/10">
                  <Layers className="h-3 w-3 text-primary" />
                </span>
                Zone
              </label>
              <div className="flex justify-center">
                <span
                  className={`inline-flex items-center justify-center h-10 min-w-[60px] rounded-lg px-4 text-sm font-medium transition-all duration-200 ${
                    zoneId === "PBB"
                      ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                      : zoneId === "Remote"
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : zoneId === "Cargo"
                      ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                      : "bg-muted text-muted-foreground border border-input"
                  }`}
                >
                  {zoneId || "—"}
                </span>
              </div>
            </div>

            {/* Code Selection */}
            <div className="group relative">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary/10">
                  <Tag className="h-3 w-3 text-primary" />
                </span>
                Code Stand
              </label>
              
              {isLoadingContext ? (
                <div className="flex items-center justify-center h-12 rounded-md border border-input bg-muted/30">
                  <span className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : codes.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {codes.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCodeId(c.id)
                        setFormErrors(prev => ({ ...prev, code: undefined }))
                      }}
                      disabled={isSubmitting}
                      className={`relative h-10 rounded-lg border text-sm font-medium transition-all duration-200 hover:cursor-pointer ${
                        codeId === c.id
                          ? "bg-primary/20 border-primary text-primary shadow-md"
                          : "bg-card border-input hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      <span className="relative z-10">{c.name}</span>
                      {codeId === c.id && (
                        <span className="absolute inset-0 rounded-lg bg-primary/10 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No codes available</p>
              )}
              
              {formErrors.code && (
                <p className="mt-1.5 text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-top-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                  {formErrors.code}
                </p>
              )}
            </div>

            {/* Aircrafts Field */}
            <div className="group relative">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary/10">
                  <Plane className="h-3 w-3 text-primary" />
                </span>
                Aircrafts
              </label>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-between h-12 px-4 text-left font-normal hover:cursor-pointer ${
                      formErrors.airplanes ? "border-destructive" : ""
                    }`}
                    disabled={isSubmitting || isLoadingContext || !codeId || airplaneList.length === 0}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Plane className="h-4 w-4 text-muted-foreground" />
                      {isLoadingContext 
                        ? "Loading aircrafts..." 
                        : !codeId 
                          ? "Select a code first" 
                          : airplaneList.length === 0 
                            ? "No aircrafts available for this code" 
                            : airplaneDisplayText}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                {codeId && airplaneList.length > 0 && !isLoadingContext && (
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto">
                    <DropdownMenuLabel className="text-xs">Available Aircrafts</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {airplaneList.map((airplane) => (
                      <DropdownMenuCheckboxItem
                        key={airplane.id}
                        checked={selectedAirplaneIds.includes(airplane.registration)}
                        onCheckedChange={() => toggleAirplane(airplane.registration)}
                      >
                        <span className="mr-2 font-mono text-xs text-muted-foreground">{airplane.registration}</span>
                        {airplane.aircraft_type}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                )}
              </DropdownMenu>
              
              {formErrors.airplanes && (
                <p className="mt-1.5 text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-top-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                  {formErrors.airplanes}
                </p>
              )}
            </div>

            {/* Active Toggle */}
            <div className="relative">
              <div className="flex items-center justify-between rounded-xl border bg-card p-4 transition-all duration-200 hover:border-primary/30">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300 ${
                    active 
                      ? "bg-emerald-500/20 text-emerald-500" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <Gauge className={`h-5 w-5 transition-transform duration-300 ${active ? "scale-100" : "scale-90"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs text-muted-foreground">
                      {active ? "Stand is currently active" : "Stand is inactive"}
                    </p>
                  </div>
                </div>
                
                {/* Custom Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  disabled={isSubmitting}
                  className={`relative h-8 w-16 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 hover:cursor-pointer ${
                    active 
                      ? "bg-emerald-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]" 
                      : "bg-muted"
                  }`}
                  aria-label={active ? "Deactivate stand" : "Activate stand"}
                >
                  <span className="sr-only">
                    {active ? "Deactivate" : "Activate"}
                  </span>
                  <span
                    className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-300 ${
                      active 
                        ? "left-[34px]" 
                        : "left-[4px]"
                    }`}
                  >
                    <span className={`text-xs font-bold transition-all duration-300 ${
                      active ? "text-emerald-500" : "text-muted-foreground"
                    }`}>
                      {active ? "ON" : "OFF"}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 h-11 transition-all duration-200 hover:bg-destructive/10 hover:cursor-pointer"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 h-11 transition-all duration-300 hover:cursor-pointer ${
                isSubmitting 
                  ? "bg-primary/80" 
                  : "bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:shadow-primary/25"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Saving...
                </span>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Decorative footer */}
        <div className="relative z-10 flex items-center justify-center gap-2 pt-4 border-t">
          <span className="h-1 w-1 rounded-full bg-primary/50 animate-pulse" />
          <span className="h-1 w-1 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "0.2s" }} />
          <span className="h-1 w-1 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
