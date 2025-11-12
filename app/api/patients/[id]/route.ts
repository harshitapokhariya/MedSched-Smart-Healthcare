import { NextRequest, NextResponse } from "next/server"

// We'll import the store from the parent route
// For now, we'll use a shared module pattern

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // This can be implemented if needed for individual patient fetching
  return NextResponse.json({ message: "Use GET /api/patients for list" })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // Redirect to main route handler
  const body = await request.json()
  const response = await fetch(`${request.nextUrl.origin}/api/patients`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: params.id, ...body }),
  })
  return response
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(request.url)
  url.searchParams.set("id", params.id)
  const response = await fetch(`${request.nextUrl.origin}/api/patients?id=${params.id}`, {
    method: "DELETE",
  })
  return response
}


