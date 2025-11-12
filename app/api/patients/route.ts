import { NextRequest, NextResponse } from "next/server"
import type { Patient, ResourceVector, Severity, Status } from "@/components/hosp-os/state"

// In-memory storage (replace with database later)
let patientsStore: Patient[] = []

// Default resource totals
const defaultTotals: ResourceVector = { OT: 2, D: 3, N: 5 }
let resourcesState = {
  total: { ...defaultTotals },
  available: { ...defaultTotals },
}

// GET - List all patients
export async function GET() {
  try {
    return NextResponse.json({ patients: patientsStore, resources: resourcesState })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 })
  }
}

// POST - Create a new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, arrivalTime, severity, burstTime, resourcesNeeded } = body

    // Validate required fields
    if (!name || typeof arrivalTime !== "number" || !severity || typeof burstTime !== "number" || !resourcesNeeded) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate severity
    if (!["P1", "P2", "P3"].includes(severity)) {
      return NextResponse.json({ error: "Invalid severity" }, { status: 400 })
    }

    // Create new patient
    const newPatient: Patient = {
      id: crypto.randomUUID(),
      name,
      arrivalTime,
      severity: severity as Severity,
      burstTime,
      resourcesNeeded: resourcesNeeded as ResourceVector,
      resourcesAllocated: { OT: 0, D: 0, N: 0 },
      status: "Waiting" as Status,
    }

    patientsStore.push(newPatient)

    return NextResponse.json({ patient: newPatient }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 })
  }
}

// PUT - Update patient
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    const index = patientsStore.findIndex((p) => p.id === id)
    if (index === -1) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Update patient
    patientsStore[index] = { ...patientsStore[index], ...updates }

    // If status changed to "Treated", release resources
    if (updates.status === "Treated") {
      const patient = patientsStore[index]
      resourcesState.available = {
        OT: resourcesState.available.OT + patient.resourcesAllocated.OT,
        D: resourcesState.available.D + patient.resourcesAllocated.D,
        N: resourcesState.available.N + patient.resourcesAllocated.N,
      }
      patientsStore[index].resourcesAllocated = { OT: 0, D: 0, N: 0 }
    }

    // Update available resources based on allocations
    updateAvailableResources()

    return NextResponse.json({ patient: patientsStore[index] })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 })
  }
}

// DELETE - Delete patient
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    const index = patientsStore.findIndex((p) => p.id === id)
    if (index === -1) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Release resources if allocated
    const patient = patientsStore[index]
    resourcesState.available = {
      OT: resourcesState.available.OT + patient.resourcesAllocated.OT,
      D: resourcesState.available.D + patient.resourcesAllocated.D,
      N: resourcesState.available.N + patient.resourcesAllocated.N,
    }

    patientsStore.splice(index, 1)
    updateAvailableResources()

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete patient" }, { status: 500 })
  }
}

// Helper function to update available resources
function updateAvailableResources() {
  const sumAlloc = patientsStore.reduce<ResourceVector>(
    (acc, p) => {
      acc.OT += p.resourcesAllocated.OT
      acc.D += p.resourcesAllocated.D
      acc.N += p.resourcesAllocated.N
      return acc
    },
    { OT: 0, D: 0, N: 0 },
  )

  resourcesState.available = {
    OT: resourcesState.total.OT - sumAlloc.OT,
    D: resourcesState.total.D - sumAlloc.D,
    N: resourcesState.total.N - sumAlloc.N,
  }
}


