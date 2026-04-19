"use client"

import { useMemo } from "react"
import type { Flight } from "@/lib/types"

interface KpiCounterProps {
  flights: Flight[]
  allocationMode: "manual" | "optimized"
}

export function KpiCounter({ flights, allocationMode }: KpiCounterProps) {
  const violations = [
    { label: "Violation 1", value: 0 },
    { label: "Violation 2", value: 0 },
    { label: "Violation 3", value: 0 },
  ]

  const kpis = [
    { label: "KPI 1", value: 0 },
    { label: "KPI 2", value: 0 },
    { label: "KPI 3", value: 0 },
  ]

  return (
    <>
      {/* Violations - Left side */}
      <div className="fixed bottom-4 left-4 z-50 flex gap-3">
        {violations.map((kpi, index) => (
          <div
            key={`violation-${index}`}
            className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-4 shadow-lg"
            style={{ minWidth: "120px" }}
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {kpi.label}
            </span>
            <span className={`mt-1 text-4xl font-bold tabular-nums ${allocationMode === "manual" ? "text-red-500" : "text-green-500"}`}>
              {kpi.value.toString().padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>

      {/* KPIs - Right side */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-3">
        {kpis.map((kpi, index) => (
          <div
            key={`kpi-${index}`}
            className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-4 shadow-lg"
            style={{ minWidth: "120px" }}
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {kpi.label}
            </span>
            <span className={`mt-1 text-4xl font-bold tabular-nums ${allocationMode === "manual" ? "text-red-500" : "text-green-500"}`}>
              {kpi.value.toString().padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
