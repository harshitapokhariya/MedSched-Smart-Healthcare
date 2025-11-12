import { NextRequest, NextResponse } from "next/server"
import { isSafeState } from "@/lib/bankers"
import type { ResourceVector } from "@/components/hosp-os/state"

interface Row {
  id: string
  name: string
  severity: any
  alloc: ResourceVector
  max: ResourceVector
  need: ResourceVector
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, request: resourceRequest } = body

    if (!patientId || !resourceRequest) {
      return NextResponse.json({ error: "Patient ID and request are required" }, { status: 400 })
    }

    // Get current state
    const patientsResponse = await fetch(`${request.nextUrl.origin}/api/patients`)
    const { patients, resources } = await patientsResponse.json()

    const patient = patients.find((p: any) => p.id === patientId)
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Build rows for banker's algorithm
    const rows: Row[] = patients.map((p: any) => ({
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
    }))

    // Check safety state
    const result = isSafeState(resources, rows, patientId, resourceRequest as ResourceVector)

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Banker's algorithm error:", error)
    return NextResponse.json({ error: "Failed to check safety state" }, { status: 500 })
  }
}


