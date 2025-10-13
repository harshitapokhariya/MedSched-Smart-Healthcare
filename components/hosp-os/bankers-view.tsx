"use client"

import { useMemo, useState } from "react"
import { useHospital, type ResourceKey, type ResourceVector, severityLabel } from "./state"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldCheck, AlertTriangle } from "lucide-react"
import { isSafeState, type SafeStateResult } from "@/lib/bankers"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const RES_KEYS: ResourceKey[] = ["OT", "D", "N"]

export function BankersView() {
  const { patients, resources } = useHospital()
  const [selected, setSelected] = useState<string | "">("")
  const [request, setRequest] = useState<ResourceVector>({ OT: 0, D: 0, N: 0 })
  const [result, setResult] = useState<SafeStateResult | null>(null)

  const allocations = useMemo(
    () =>
      patients.map((p) => ({
        id: p.id,
        name: p.name,
        severity: p.severity,
        alloc: p.resourcesAllocated,
        max: p.resourcesNeeded,
        need: {
          OT: Math.max(0, p.resourcesNeeded.OT - p.resourcesAllocated.OT),
          D: Math.max(0, p.resourcesNeeded.D - p.resourcesAllocated.D),
          N: Math.max(0, p.resourcesNeeded.N - p.resourcesAllocated.N),
        },
      })),
    [patients],
  )

  const onTest = () => {
    if (!selected) return
    const res = isSafeState(resources, allocations, selected, request)
    setResult(res)
  }

  return (
    <div className="grid grid-cols-1 gap-6 soft-appear">
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-primary">Resource Inventory</h3>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <InfoCard title="Total" values={resources.total} />
          <InfoCard title="Allocated (Σ)" values={sumAlloc(patients.map((p) => p.resourcesAllocated))} />
          <InfoCard title="Available" values={resources.available} />
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-lg font-semibold text-primary">Banker&apos;s State Table</h3>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Allocation (OT,D,N)</TableHead>
                <TableHead>Max Need (OT,D,N)</TableHead>
                <TableHead>Need (OT,D,N)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{severityLabel[row.severity]}</TableCell>
                  <TableCell>{fmt(row.alloc)}</TableCell>
                  <TableCell>{fmt(row.max)}</TableCell>
                  <TableCell>{fmt(row.need)}</TableCell>
                </TableRow>
              ))}
              {allocations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No patients available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-lg font-semibold text-primary">Resource Request Simulator</h3>
        <div className="grid items-end gap-4 md:grid-cols-5">
          <div className="grid gap-2 md:col-span-2">
            <Label>Patient</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {RES_KEYS.map((k) => (
            <div key={k} className="grid gap-2">
              <Label htmlFor={`req-${k}`}>Request {k}</Label>
              <Input
                id={`req-${k}`}
                type="number"
                min={0}
                value={request[k]}
                onChange={(e) => setRequest((prev) => ({ ...prev, [k]: Number(e.target.value) }))}
              />
            </div>
          ))}

          <div className="md:col-span-5">
            <Button onClick={onTest}>Test Safety State</Button>
          </div>
        </div>

        {result && (
          <div className="mt-4">
            {result.safe ? (
              <Alert>
                <ShieldCheck className="h-4 w-4" aria-hidden />
                <AlertTitle>System is in a SAFE state</AlertTitle>
                <AlertDescription>
                  Safe sequence: {result.safeSequence.map((id) => patients.find((p) => p.id === id)?.name).join(" → ")}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden />
                <AlertTitle>System is in an UNSAFE state</AlertTitle>
                <AlertDescription>The request would lead to an unsafe allocation.</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

function InfoCard({ title, values }: { title: string; values: ResourceVector }) {
  return (
    <Card className="p-4 border-primary/20">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-1 flex items-center gap-3 text-lg font-semibold">
        <span>OT: {values.OT}</span>
        <span>D: {values.D}</span>
        <span>N: {values.N}</span>
      </div>
    </Card>
  )
}

function sumAlloc(list: ResourceVector[]) {
  return list.reduce<ResourceVector>((acc, v) => ({ OT: acc.OT + v.OT, D: acc.D + v.D, N: acc.N + v.N }), {
    OT: 0,
    D: 0,
    N: 0,
  })
}

function fmt(v: ResourceVector) {
  return `(${v.OT}, ${v.D}, ${v.N})`
}
