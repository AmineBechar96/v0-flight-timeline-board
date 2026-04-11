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
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { fetchZones, fetchCodes } from "@/lib/data"

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
  const [zoneId, setZoneId] = useState(currentZoneId)
  const [codeId, setCodeId] = useState(currentCodeId)
  const [airplanes, setAirplanes] = useState(currentAirplanes)
  const [active, setActive] = useState(currentActive)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [zones, setZones] = useState<{ id: string; name: string }[]>([])
  const [codes, setCodes] = useState<{ id: string; name: string }[]>([])
  const [formErrors, setFormErrors] = useState<{ zone?: string; code?: string; airplanes?: string }>({})

  // Fetch zones and codes when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoneId(currentZoneId)
      setCodeId(currentCodeId)
      setAirplanes(currentAirplanes)
      setActive(currentActive)
      setFormErrors({})
      
      // Load zones and codes from Supabase in parallel
      setIsLoadingData(true)
      Promise.all([fetchZones(), fetchCodes()])
        .then(([zonesData, codesData]) => {
          setZones(zonesData)
          setCodes(codesData)
        })
        .catch(() => {
          setZones([])
          setCodes([])
        })
        .finally(() => setIsLoadingData(false))
    }
  }, [isOpen, currentZoneId, currentCodeId, currentAirplanes, currentActive])

  const validateForm = () => {
    const errors: { zone?: string; code?: string; airplanes?: string } = {}
    
    if (!zoneId.trim()) {
      errors.zone = "Please select a zone"
    }
    
    if (!codeId.trim()) {
      errors.code = "Please select a code"
    }
    
    if (!airplanes.trim()) {
      errors.airplanes = "Airplanes list is required"
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
      airplanes: airplanes.trim(),
      active,
    })
    
    setIsSubmitting(false)
    onClose()
  }

  const handleClose = () => {
    setZoneId(currentZoneId)
    setCodeId(currentCodeId)
    setAirplanes(currentAirplanes)
    setActive(currentActive)
    setFormErrors({})
    onClose()
  }

  const getZoneName = (id: string) => zones.find(z => z.id === id)?.name || id
  const getCodeName = (id: string) => codes.find(c => c.id === id)?.name || id

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
            {/* Zone Selection */}
            <div className="group relative">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary/10">
                  <Layers className="h-3 w-3 text-primary" />
                </span>
                Zone
              </label>
              
              {isLoadingData ? (
                <div className="flex items-center justify-center h-12 rounded-md border border-input bg-muted/30">
                  <span className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : zones.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {zones.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => {
                        setZoneId(z.id)
                        setFormErrors(prev => ({ ...prev, zone: undefined }))
                      }}
                      disabled={isSubmitting}
                      className={`relative h-10 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        zoneId === z.id
                          ? "bg-primary/20 border-primary text-primary shadow-md"
                          : "bg-card border-input hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      <span className="relative z-10">{z.name}</span>
                      {zoneId === z.id && (
                        <span className="absolute inset-0 rounded-lg bg-primary/10 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No zones available</p>
              )}
              
              {formErrors.zone && (
                <p className="mt-1.5 text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-top-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                  {formErrors.zone}
                </p>
              )}
            </div>

            {/* Code Selection */}
            <div className="group relative">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary/10">
                  <Tag className="h-3 w-3 text-primary" />
                </span>
                Code Stand
              </label>
              
              {isLoadingData ? (
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
                      className={`relative h-10 rounded-lg border text-sm font-medium transition-all duration-200 ${
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

            {/* Airplanes Field */}
            <div className="group relative">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary/10">
                  <Plane className="h-3 w-3 text-primary" />
                </span>
                Airplanes
              </label>
              <div className="relative">
                <Input
                  value={airplanes}
                  onChange={(e) => {
                    setAirplanes(e.target.value)
                    setFormErrors(prev => ({ ...prev, airplanes: undefined }))
                  }}
                  placeholder="e.g., Boeing 737, Airbus A320"
                  className={`h-12 pl-11 pr-4 text-base transition-all duration-200 ${
                    formErrors.airplanes 
                      ? "border-destructive focus-visible:ring-destructive/50" 
                      : "focus:border-primary focus:ring-primary/20"
                  }`}
                  disabled={isSubmitting}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                  ✈
                </span>
              </div>
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
                  className={`relative h-8 w-16 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 ${
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
              className="flex-1 h-11 transition-all duration-200 hover:bg-destructive/10"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 h-11 transition-all duration-300 ${
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
