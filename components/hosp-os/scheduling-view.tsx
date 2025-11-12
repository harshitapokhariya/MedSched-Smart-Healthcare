"use client"

import { useMemo, useState } from "react"
import { useHospital } from "./state"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, BarChart3 } from "lucide-react"
import { runScheduling, type SchedulingAlgo, type SchedulingResult } from "@/lib/scheduling"
import { Gantt } from "./viz/gantt"
import { UtilizationChart } from "./viz/utilization-chart"

export function SchedulingView() {
  const { patients } = useHospital()
  const [algo, setAlgo] = useState<SchedulingAlgo>("FCFS")
  const [quantum, setQuantum] = useState<number | "">("" as any)
  const [result, setResult] = useState<SchedulingResult | null>(null)

  const canRun = patients.length > 0 && (algo !== "RR" || (typeof quantum === "number" && quantum > 0))

  const onRun = () => {
    const q = algo === "RR" ? Number(quantum) : undefined
    const r = runScheduling(patients, algo, q)
    setResult(r)
  }

  const metrics = useMemo(() => {
    if (!result) return null
    return [
      { label: "Total Patients", value: result.totalProcessed },
      { label: "Avg Waiting Time", value: `${result.averageWaitingTime.toFixed(1)}m` },
      { label: "Throughput", value: `${result.throughput.toFixed(2)}/hr` },
    ]
  }, [result])

  return (
    <div className="grid grid-cols-1 gap-6 soft-appear">
      <Card className="p-4">
        <div className="grid items-end gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Algorithm</Label>
            <Select value={algo} onValueChange={(v) => setAlgo(v as SchedulingAlgo)}>
              <SelectTrigger>
                <SelectValue placeholder="Select algorithm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FCFS">FCFS</SelectItem>
                <SelectItem value="SJF">SJF</SelectItem>
                <SelectItem value="RR">Round Robin</SelectItem>
                <SelectItem value="PRIORITY">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="q">Quantum (RR)</Label>
            <Input
              id="q"
              type="number"
              placeholder="e.g., 4"
              disabled={algo !== "RR"}
              value={quantum}
              onChange={(e) => setQuantum(e.target.value === "" ? "" : Number(e.target.value))}
              min={1}
            />
          </div>

          <div className="flex items-end">
            <Button className="w-full" onClick={onRun} disabled={!canRun}>
              <Activity className="mr-2 size-4" aria-hidden />
              Run Simulation
            </Button>
          </div>
        </div>

        {metrics && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {metrics.map((m) => (
              <Card key={m.label} className="p-4 border-primary/20 shadow-sm">
                <div className="text-sm text-muted-foreground">{m.label}</div>
                <div className="text-2xl font-semibold text-foreground">{m.value}</div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-lg font-semibold text-primary">Patient Flow</h3>
        <Gantt segments={result?.segments ?? []} />
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <BarChart3 className="size-4" aria-hidden />
          <h3 className="text-lg font-semibold text-primary">Resource Utilization</h3>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Utilization of OT, Doctor, Nurse over time based on the computed schedule.
        </p>
        <UtilizationChart utilizations={result?.utilization ?? []} />
      </Card>
    </div>
  )
}
