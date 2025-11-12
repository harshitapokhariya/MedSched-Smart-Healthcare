import { NextRequest, NextResponse } from "next/server"
import { runScheduling, type SchedulingAlgo } from "@/lib/scheduling"
import type { Patient } from "@/components/hosp-os/state"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { algo, quantum } = body

    if (!algo) {
      return NextResponse.json({ error: "Algorithm is required" }, { status: 400 })
    }

    if (!["FCFS", "SJF", "RR", "PRIORITY"].includes(algo)) {
      return NextResponse.json({ error: "Invalid algorithm" }, { status: 400 })
    }

    if (algo === "RR" && (!quantum || quantum <= 0)) {
      return NextResponse.json({ error: "Quantum is required for Round Robin" }, { status: 400 })
    }

    // Get patients from store
    const patientsResponse = await fetch(`${request.nextUrl.origin}/api/patients`)
    const { patients } = await patientsResponse.json()

    if (!patients || patients.length === 0) {
      return NextResponse.json({ error: "No patients available" }, { status: 400 })
    }

    // Run scheduling algorithm
    const result = runScheduling(patients as Patient[], algo as SchedulingAlgo, quantum)

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Scheduling error:", error)
    return NextResponse.json({ error: "Failed to run scheduling algorithm" }, { status: 500 })
  }
}


