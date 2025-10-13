"use client"

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import type { UtilizationPoint } from "@/lib/scheduling"

export function UtilizationChart({ utilizations }: { utilizations: UtilizationPoint[] }) {
  if (!utilizations.length) {
    return (
      <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        No data yet. Run a simulation to view utilization.
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={utilizations}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="OT" stroke="oklch(var(--chart-5))" dot={false} />
          <Line type="monotone" dataKey="D" stroke="oklch(var(--chart-4))" dot={false} />
          <Line type="monotone" dataKey="N" stroke="oklch(var(--chart-2))" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
