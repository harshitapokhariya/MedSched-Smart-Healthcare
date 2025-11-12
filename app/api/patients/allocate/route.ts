import { NextRequest, NextResponse } from "next/server"
import type { ResourceVector } from "@/components/hosp-os/state"

// Import the store from the patients route
// For a proper implementation, use a shared data store module

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, allocation } = body

    if (!patientId || !allocation) {
      return NextResponse.json({ error: "Patient ID and allocation are required" }, { status: 400 })
    }

    // Get current state
    const patientsResponse = await fetch(`${request.nextUrl.origin}/api/patients`)
    const { patients, resources } = await patientsResponse.json()

    const patientIndex = patients.findIndex((p: any) => p.id === patientId)
    if (patientIndex === -1) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    const patient = patients[patientIndex]

    // Calculate new allocation
    const newAllocation: ResourceVector = {
      OT: allocation.OT ?? patient.resourcesAllocated.OT,
      D: allocation.D ?? patient.resourcesAllocated.D,
      N: allocation.N ?? patient.resourcesAllocated.N,
    }

    // Check if resources are available
    const currentAllocated = patients.reduce(
      (sum: ResourceVector, p: any) => ({
        OT: sum.OT + (p.id === patientId ? 0 : p.resourcesAllocated.OT),
        D: sum.D + (p.id === patientId ? 0 : p.resourcesAllocated.D),
        N: sum.N + (p.id === patientId ? 0 : p.resourcesAllocated.N),
      }),
      { OT: 0, D: 0, N: 0 },
    )

    const required = {
      OT: currentAllocated.OT + newAllocation.OT,
      D: currentAllocated.D + newAllocation.D,
      N: currentAllocated.N + newAllocation.N,
    }

    if (
      required.OT > resources.total.OT ||
      required.D > resources.total.D ||
      required.N > resources.total.N
    ) {
      return NextResponse.json({ error: "Insufficient resources" }, { status: 400 })
    }

    // Update patient allocation
    const updateResponse = await fetch(`${request.nextUrl.origin}/api/patients`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: patientId,
        resourcesAllocated: newAllocation,
      }),
    })

    const updated = await updateResponse.json()

    // Get updated resources
    const updatedResponse = await fetch(`${request.nextUrl.origin}/api/patients`)
    const { resources: updatedResources } = await updatedResponse.json()

    return NextResponse.json({
      patient: updated.patient,
      resources: updatedResources,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to allocate resources" }, { status: 500 })
  }
}


