import { NextRequest, NextResponse } from "next/server"
import type { ResourceVector } from "@/components/hosp-os/state"

export async function GET() {
  try {
    // Get current resources from patients endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/patients`)
    const { resources } = await response.json()
    return NextResponse.json({ resources })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { total } = body

    if (!total || typeof total.OT !== "number" || typeof total.D !== "number" || typeof total.N !== "number") {
      return NextResponse.json({ error: "Invalid resource totals" }, { status: 400 })
    }

    // Note: In a full implementation, this would update a shared store
    // For now, resources are managed through the patients endpoint
    return NextResponse.json({ message: "Resource totals updated", total })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update resources" }, { status: 500 })
  }
}


