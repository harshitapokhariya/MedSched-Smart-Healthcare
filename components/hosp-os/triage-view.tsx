"use client"

import { Card } from "@/components/ui/card"
import { TriageForm } from "./triage/triage-form"
import { PatientTable } from "./triage/patient-table"

export function TriageView() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 soft-appear">
      <Card className="p-4 sm:p-6 lg:col-span-1 rounded-2xl shadow-sm bg-background text-foreground">
        <h2 className="mb-2 text-lg font-semibold text-primary">Admit Patient</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Add patients with severity, burst time, and resource needs.
        </p>
        <TriageForm />
      </Card>

      <Card className="p-4 sm:p-6 lg:col-span-2 rounded-2xl shadow-sm bg-background text-foreground">
        <h2 className="mb-2 text-lg font-semibold text-primary">Master Patient Queue</h2>
        <p className="mb-4 text-sm text-muted-foreground">Manage patient status and allocations.</p>
        <PatientTable />
      </Card>
    </div>
  )
}
