"use client"

import type React from "react"

import { createContext, useContext, useMemo, useState } from "react"

export type ResourceKey = "OT" | "D" | "N"
export type Severity = "P1" | "P2" | "P3"
export type Status = "Waiting" | "Scheduled" | "Treated"

export type ResourceVector = Record<ResourceKey, number>

export interface Patient {
  id: string
  name: string
  arrivalTime: number
  severity: Severity
  burstTime: number
  resourcesNeeded: ResourceVector
  resourcesAllocated: ResourceVector
  status: Status
  completionTime?: number
  waitingTime?: number
}

interface ResourcesState {
  total: ResourceVector
  available: ResourceVector
}

interface HospitalContextValue {
  patients: Patient[]
  resources: ResourcesState
  admitPatient: (p: Omit<Patient, "id" | "status" | "resourcesAllocated">) => void
  markTreated: (id: string) => void
  setAllocation: (id: string, alloc: Partial<ResourceVector>) => void
  resetAllocations: () => void
}

const defaultTotals: ResourceVector = { OT: 2, D: 3, N: 5 }

const HospitalContext = createContext<HospitalContextValue | null>(null)

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [resources, setResources] = useState<ResourcesState>({
    total: { ...defaultTotals },
    available: { ...defaultTotals },
  })

  const admitPatient: HospitalContextValue["admitPatient"] = (p) => {
    const id = crypto.randomUUID()
    const newPatient: Patient = {
      id,
      status: "Waiting",
      resourcesAllocated: { OT: 0, D: 0, N: 0 },
      ...p,
    }
    setPatients((prev) => [...prev, newPatient])
  }

  const markTreated: HospitalContextValue["markTreated"] = (id) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, status: "Treated" } : p)))
    // Release any allocations for treated patient
    const treated = patients.find((p) => p.id === id)
    if (treated) {
      setResources((r) => ({
        total: r.total,
        available: {
          OT: r.available.OT + treated.resourcesAllocated.OT,
          D: r.available.D + treated.resourcesAllocated.D,
          N: r.available.N + treated.resourcesAllocated.N,
        },
      }))
      setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, resourcesAllocated: { OT: 0, D: 0, N: 0 } } : p)))
    }
  }

  const setAllocation: HospitalContextValue["setAllocation"] = (id, alloc) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              resourcesAllocated: {
                ...p.resourcesAllocated,
                ...alloc,
              },
            }
          : p,
      ),
    )
    // Recompute available from totals - sum of allocations
    setResources((r) => {
      const sumAlloc = patients.reduce<ResourceVector>(
        (acc, p) => {
          const a = p.id === id ? { ...p.resourcesAllocated, ...alloc } : p.resourcesAllocated
          acc.OT += a.OT
          acc.D += a.D
          acc.N += a.N
          return acc
        },
        { OT: 0, D: 0, N: 0 },
      )
      return {
        total: r.total,
        available: {
          OT: r.total.OT - sumAlloc.OT,
          D: r.total.D - sumAlloc.D,
          N: r.total.N - sumAlloc.N,
        },
      }
    })
  }

  const resetAllocations = () => {
    setPatients((prev) => prev.map((p) => ({ ...p, resourcesAllocated: { OT: 0, D: 0, N: 0 } })))
    setResources({ total: { ...defaultTotals }, available: { ...defaultTotals } })
  }

  const value = useMemo<HospitalContextValue>(
    () => ({
      patients,
      resources,
      admitPatient,
      markTreated,
      setAllocation,
      resetAllocations,
    }),
    [patients, resources],
  )

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>
}

export function useHospital() {
  const ctx = useContext(HospitalContext)
  if (!ctx) throw new Error("useHospital must be used within HospitalProvider")
  return ctx
}

export const severityLabel: Record<Severity, string> = {
  P1: "Critical",
  P2: "Serious",
  P3: "Stable",
}

export const severityColorClass: Record<Severity, string> = {
  // Map severities to theme chart tokens to avoid raw colors
  P1: "bg-chart-5", // warm/alert
  P2: "bg-chart-4", // accent
  P3: "bg-chart-2", // cool/steady
}
