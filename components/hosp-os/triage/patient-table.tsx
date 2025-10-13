"use client"

import { useMemo } from "react"
import { useHospital, severityLabel } from "../state"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export function PatientTable() {
  const { patients, markTreated } = useHospital()

  const sorted = useMemo(() => [...patients].sort((a, b) => a.arrivalTime - b.arrivalTime), [patients])

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Arrival</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Burst</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Resources Needed</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.arrivalTime}</TableCell>
              <TableCell>
                <Badge variant="secondary">{severityLabel[p.severity]}</Badge>
              </TableCell>
              <TableCell>{p.burstTime}m</TableCell>
              <TableCell>{p.status}</TableCell>
              <TableCell>
                <div className="flex gap-1 text-xs text-muted-foreground">
                  {p.resourcesNeeded.OT ? <span className="rounded bg-muted px-1">OT</span> : null}
                  {p.resourcesNeeded.D ? <span className="rounded bg-muted px-1">D</span> : null}
                  {p.resourcesNeeded.N ? <span className="rounded bg-muted px-1">N</span> : null}
                  {!p.resourcesNeeded.OT && !p.resourcesNeeded.D && !p.resourcesNeeded.N ? (
                    <span className="text-muted-foreground">None</span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={() => markTreated(p.id)}>
                    Mark Treated
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No patients yet. Add one using the form.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
