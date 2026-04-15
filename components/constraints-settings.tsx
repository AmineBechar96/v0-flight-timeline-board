"use client"

import { useState, useEffect, useCallback } from "react"
import { Settings, Clock, Save, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchConstraintConfig, saveConstraint } from "@/lib/data"
import { DEFAULT_CONSTRAINTS } from "@/lib/types"

interface ConstraintsSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function ConstraintsSettings({ isOpen, onClose }: ConstraintsSettingsProps) {
  const [minTurnaroundMinutes, setMinTurnaroundMinutes] = useState(15)
  const [adjacentPbbGapMinutes, setAdjacentPbbGapMinutes] = useState(5)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load constraint value on mount
  useEffect(() => {
    if (isOpen) {
      loadConstraint()
    }
  }, [isOpen])

  const loadConstraint = async () => {
    setIsLoading(true)
    try {
      const turnaroundValue = await fetchConstraintConfig('min_stand_turnaround_minutes')
      setMinTurnaroundMinutes(turnaroundValue ?? DEFAULT_CONSTRAINTS.min_stand_turnaround_minutes)
      
      const adjacentGapValue = await fetchConstraintConfig('adjacent_pbb_movement_gap_minutes')
      setAdjacentPbbGapMinutes(adjacentGapValue ?? DEFAULT_CONSTRAINTS.adjacent_pbb_movement_gap_minutes)
    } catch (error) {
      console.error("Error loading constraint:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const successTurnaround = await saveConstraint('min_stand_turnaround_minutes', minTurnaroundMinutes)
      const successAdjacent = await saveConstraint('adjacent_pbb_movement_gap_minutes', adjacentPbbGapMinutes)
      
      if (successTurnaround && successAdjacent) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error("Error saving constraint:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleMinTurnaroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0 && value <= 120) {
      setMinTurnaroundMinutes(value)
    }
  }

  const handleAdjacentPbbGapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0 && value <= 60) {
      setAdjacentPbbGapMinutes(value)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Constraints Settings</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure allocation constraints
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Minimum Stand Turnaround */}
          <div className="space-y-2 border-b border-border pb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Minimum Stand Turnaround (minutes)
            </label>
            <div className="flex items-center gap-3 mt-2">
              <Input
                type="number"
                min="0"
                max="120"
                value={minTurnaroundMinutes}
                onChange={handleMinTurnaroundChange}
                disabled={isLoading || isSaving}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                minutes gap required between flights on the same stand
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Default: {DEFAULT_CONSTRAINTS.min_stand_turnaround_minutes} minutes. 
              Range: 0-120 minutes.
            </p>
          </div>

          {/* Adjacent PBB Movement Gap */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Adjacent PBB Movement Gap (minutes)
            </label>
            <div className="flex items-center gap-3 mt-2">
              <Input
                type="number"
                min="0"
                max="60"
                value={adjacentPbbGapMinutes}
                onChange={handleAdjacentPbbGapChange}
                disabled={isLoading || isSaving}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                minutes required between movements on adjacent stands
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Default: {DEFAULT_CONSTRAINTS.adjacent_pbb_movement_gap_minutes} minutes. 
              Range: 0-60 minutes.
            </p>
            <div className="mt-3 bg-muted/50 p-3 rounded-md text-xs text-muted-foreground">
              <p className="font-medium mb-1 text-foreground">Adjacent Pairs Evaluated:</p>
              <p>3 ↔ 4, 4 ↔ 5, 5 ↔ 6, 6 ↔ 7, 7 ↔ 8</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Saving...
              </span>
            ) : saved ? (
              <span className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Saved!
              </span>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}