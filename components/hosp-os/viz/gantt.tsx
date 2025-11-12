"use client"

import { severityColorClass } from "../state"
import type { SchedulingSegment } from "@/lib/scheduling"

interface Props {
  segments: SchedulingSegment[]
}

export function Gantt({ segments }: Props) {
  if (!segments.length) {
    return (
      <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        No schedule yet. Run a simulation to view the Gantt chart.
      </div>
    )
  }

  const endTime = Math.max(...segments.map((s) => s.end))
  const rows = groupByPatient(segments)

  return (
    <div className="space-y-4">
      {rows.map(({ patientName, severity, items }) => (
        <div key={patientName} className="grid grid-cols-[120px_1fr] items-center gap-2">
          <div className="text-sm">{patientName}</div>
          <div className="relative h-8 rounded bg-muted">
            {items.map((s, idx) => {
              const left = (s.start / endTime) * 100
              const width = ((s.end - s.start) / endTime) * 100
              return (
                <div
                  key={idx}
                  className={`absolute top-0 h-8 ${severityColorClass[severity]} text-xs text-primary-foreground flex items-center justify-center border`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${patientName}: ${s.start} → ${s.end} (${s.end - s.start}m)`}
                  aria-label={`${patientName} from ${s.start} to ${s.end}`}
                >
                  <span className="px-1">{s.end - s.start}m</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

    </div>
  )
}

function groupByPatient(segments: SchedulingSegment[]) {
  const byName: Record<
    string,
    { patientName: string; severity: SchedulingSegment["severity"]; items: SchedulingSegment[] }
  > = {}
  for (const s of segments) {
    if (!byName[s.patientName]) {
      byName[s.patientName] = { patientName: s.patientName, severity: s.severity, items: [] }
    }
    byName[s.patientName].items.push(s)
  }
  return Object.values(byName)
}
