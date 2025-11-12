"use client"

import type React from "react"

import { createContext, useContext, useMemo, useState, useEffect } from "react"
import { api } from "@/lib/api"

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
  loading: boolean
  error: string | null
  admitPatient: (p: Omit<Patient, "id" | "status" | "resourcesAllocated">) => Promise<void>
  markTreated: (id: string) => Promise<void>
  setAllocation: (id: string, alloc: Partial<ResourceVector>) => Promise<void>
  resetAllocations: () => void
  loadData: () => Promise<void>
}

const defaultTotals: ResourceVector = { OT: 2, D: 3, N: 5 }

const HospitalContext = createContext<HospitalContextValue | null>(null)

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [resources, setResources] = useState<ResourcesState>({
    total: { ...defaultTotals },
    available: { ...defaultTotals },
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial data from backend
  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getPatients()
      setPatients(data.patients)
      setResources(data.resources)
    } catch (err) {
      console.error("Failed to load data from backend:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
      // Continue with local state if backend fails
    } finally {
      setLoading(false)
    }
  }

  const admitPatient: HospitalContextValue["admitPatient"] = async (p) => {
    try {
      setError(null)
      const response = await api.createPatient(p)
      setPatients((prev) => [...prev, response.patient])
      // Update resources
      const resourceData = await api.getResources()
      setResources(resourceData.resources)
    } catch (err) {
      console.error("Failed to create patient:", err)
      setError(err instanceof Error ? err.message : "Failed to create patient")
      // Fallback to local state
      const id = crypto.randomUUID()
      const newPatient: Patient = {
        id,
        status: "Waiting",
        resourcesAllocated: { OT: 0, D: 0, N: 0 },
        ...p,
      }
      setPatients((prev) => [...prev, newPatient])
    }
  }

  const markTreated: HospitalContextValue["markTreated"] = async (id) => {
    try {
      setError(null)
      await api.updatePatient(id, { status: "Treated" })
      // Reload data to get updated state
      await loadData()
    } catch (err) {
      console.error("Failed to update patient:", err)
      setError(err instanceof Error ? err.message : "Failed to mark as treated")
      // Fallback to local state
      setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, status: "Treated" } : p)))
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
  }

  const setAllocation: HospitalContextValue["setAllocation"] = async (id, alloc) => {
    try {
      setError(null)
      // Get current patient allocation and merge with new allocation
      const patient = patients.find((p) => p.id === id)
      if (!patient) return
      
      const newAllocation = {
        OT: alloc.OT ?? patient.resourcesAllocated.OT,
        D: alloc.D ?? patient.resourcesAllocated.D,
        N: alloc.N ?? patient.resourcesAllocated.N,
      }
      
      const response = await api.allocateResources(id, newAllocation)
      setPatients((prev) => prev.map((p) => (p.id === id ? response.patient : p)))
      setResources(response.resources)
    } catch (err) {
      console.error("Failed to allocate resources:", err)
      setError(err instanceof Error ? err.message : "Failed to allocate resources")
      // Fallback to local state
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
  }

  const resetAllocations = () => {
    setPatients((prev) => prev.map((p) => ({ ...p, resourcesAllocated: { OT: 0, D: 0, N: 0 } })))
    setResources({ total: { ...defaultTotals }, available: { ...defaultTotals } })
  }

  const value = useMemo<HospitalContextValue>(
    () => ({
      patients,
      resources,
      loading,
      error,
      admitPatient,
      markTreated,
      setAllocation,
      resetAllocations,
      loadData,
    }),
    [patients, resources, loading, error],
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
