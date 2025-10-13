"use client"

import type React from "react"

import { useState } from "react"
import { useHospital, type ResourceVector, type Severity } from "../state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export function TriageForm() {
  const { admitPatient, patients } = useHospital()
  const [name, setName] = useState("")
  const [arrivalTime, setArrivalTime] = useState<number | "">("")
  const [severity, setSeverity] = useState<Severity>("P2")
  const [burstTime, setBurstTime] = useState<number | "">("")
  const [needs, setNeeds] = useState<ResourceVector>({ OT: 0, D: 0, N: 0 })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !burstTime) return
    const at =
      arrivalTime === "" ? (patients.length ? Math.max(...patients.map((p) => p.arrivalTime)) + 1 : 0) : arrivalTime
    admitPatient({
      name,
      arrivalTime: at,
      severity,
      burstTime: Number(burstTime),
      resourcesNeeded: needs,
    })
    setName("")
    setArrivalTime("")
    setSeverity("P2")
    setBurstTime("")
    setNeeds({ OT: 0, D: 0, N: 0 })
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="e.g., John Doe" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="arrival">Arrival Time</Label>
          <Input
            id="arrival"
            type="number"
            placeholder="auto"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value === "" ? "" : Number(e.target.value))}
            min={0}
          />
        </div>
        <div className="grid gap-2">
          <Label>Severity (Priority)</Label>
          <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}>
            <SelectTrigger>
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="P1">Critical (P1)</SelectItem>
              <SelectItem value="P2">Serious (P2)</SelectItem>
              <SelectItem value="P3">Stable (P3)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="burst">Estimated Treatment Time (min)</Label>
        <Input
          id="burst"
          type="number"
          min={1}
          placeholder="e.g., 15"
          value={burstTime}
          onChange={(e) => setBurstTime(e.target.value === "" ? "" : Number(e.target.value))}
          required
        />
      </div>

      <fieldset className="mt-2">
        <legend className="mb-2 text-sm font-medium">Required Resources (Max Need)</legend>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { key: "OT", label: "OT Slot" },
              { key: "D", label: "Specialist Doctor" },
              { key: "N", label: "Nurse" },
            ] as const
          ).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={needs[key] > 0}
                onCheckedChange={(checked) => setNeeds((prev) => ({ ...prev, [key]: checked ? 1 : 0 }))}
                aria-label={label}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" className="mt-2 transition-transform will-change-transform hover:scale-105">
        Admit Patient
      </Button>
    </form>
  )
}
