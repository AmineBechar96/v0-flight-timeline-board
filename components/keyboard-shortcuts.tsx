"use client"

import { useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onRefresh: () => void
  onToggleHelp: () => void
  onFocusSearch: () => void
  onScrollToNow: () => void
  onClearFilters: () => void
}

const shortcuts = [
  { keys: ["Ctrl", "+"], description: "Zoom in" },
  { keys: ["Ctrl", "-"], description: "Zoom out" },
  { keys: ["Ctrl", "0"], description: "Reset zoom to 100%" },
  { keys: ["R"], description: "Refresh flight data" },
  { keys: ["/"], description: "Focus search" },
  { keys: ["N"], description: "Scroll to current time" },
  { keys: ["Esc"], description: "Clear filters / Close dialogs" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
]

export function KeyboardShortcuts({
  isOpen,
  onClose,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRefresh,
  onToggleHelp,
  onFocusSearch,
  onScrollToNow,
  onClearFilters,
}: KeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        if (e.key === "Escape") {
          ;(e.target as HTMLElement).blur()
        }
        return
      }

      // Ctrl/Cmd + key shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "=":
          case "+":
            e.preventDefault()
            onZoomIn()
            break
          case "-":
            e.preventDefault()
            onZoomOut()
            break
          case "0":
            e.preventDefault()
            onResetZoom()
            break
        }
        return
      }

      // Single key shortcuts
      switch (e.key) {
        case "r":
        case "R":
          e.preventDefault()
          onRefresh()
          break
        case "?":
          e.preventDefault()
          onToggleHelp()
          break
        case "/":
          e.preventDefault()
          onFocusSearch()
          break
        case "n":
        case "N":
          e.preventDefault()
          onScrollToNow()
          break
        case "Escape":
          if (isOpen) {
            onClose()
          } else {
            onClearFilters()
          }
          break
      }
    },
    [
      isOpen,
      onClose,
      onZoomIn,
      onZoomOut,
      onResetZoom,
      onRefresh,
      onToggleHelp,
      onFocusSearch,
      onScrollToNow,
      onClearFilters,
    ]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex} className="flex items-center gap-1">
                    <Kbd>{key}</Kbd>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="text-muted-foreground">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Press <Kbd>?</Kbd> anytime to show this dialog
        </p>
      </DialogContent>
    </Dialog>
  )
}
