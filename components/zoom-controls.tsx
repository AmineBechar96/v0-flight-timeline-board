"use client"

import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3]

interface ZoomControlsProps {
  zoom: number
  onZoomChange: (zoom: number) => void
}

export function ZoomControls({ zoom, onZoomChange }: ZoomControlsProps) {
  const currentIndex = ZOOM_LEVELS.indexOf(zoom)

  const handleZoomIn = () => {
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      onZoomChange(ZOOM_LEVELS[currentIndex + 1])
    }
  }

  const handleZoomOut = () => {
    if (currentIndex > 0) {
      onZoomChange(ZOOM_LEVELS[currentIndex - 1])
    }
  }

  const handleReset = () => {
    onZoomChange(1)
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomOut}
        disabled={currentIndex === 0}
        className="h-7 w-7 p-0 hover:cursor-pointer"
        title="Zoom Out (Ctrl+-)"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <div className="flex items-center">
        {ZOOM_LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => onZoomChange(level)}
            className={cn(
              "flex h-7 min-w-[2.5rem] items-center justify-center px-1.5 text-xs font-medium transition-colors hover:cursor-pointer",
              zoom === level
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={`${level * 100}%`}
          >
            {level}x
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomIn}
        disabled={currentIndex === ZOOM_LEVELS.length - 1}
        className="h-7 w-7 p-0 hover:cursor-pointer"
        title="Zoom In (Ctrl++)"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <div className="mx-1 h-4 w-px bg-border" />

      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        className="h-7 w-7 p-0 hover:cursor-pointer"
        title="Reset Zoom (Ctrl+0)"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
