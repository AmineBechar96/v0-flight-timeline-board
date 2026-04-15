"use client"

import { cn } from "@/lib/utils"

export type AllocationMode = "manual" | "optimized"

interface AllocationModeSwitcherProps {
  mode: AllocationMode
  onModeChange: (mode: AllocationMode) => void
}

export function AllocationModeSwitcher({
  mode,
  onModeChange,
}: AllocationModeSwitcherProps) {
  const isManual = mode === "manual"
  const isOptimized = mode === "optimized"

  return (
    <div className="flex items-center rounded-full bg-muted/50 p-0.5 border border-border">
      <button
        onClick={() => onModeChange("manual")}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 hover:cursor-pointer",
          isManual
            ? "bg-red-600 text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        Manual
      </button>
      <button
        onClick={() => onModeChange("optimized")}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 hover:cursor-pointer",
          isOptimized
            ? "bg-green-600 text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        Optimized
      </button>
    </div>
  )
}
