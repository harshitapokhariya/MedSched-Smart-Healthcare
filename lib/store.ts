import type { Patient, ResourceVector, Status } from "@/components/hosp-os/state"

// Shared in-memory store for API routes
// In production, replace this with a database

const defaultTotals: ResourceVector = { OT: 2, D: 3, N: 5 }

class HospitalStore {
  private patients: Patient[] = []
  private resources = {
    total: { ...defaultTotals },
    available: { ...defaultTotals },
  }

  getPatients(): Patient[] {
    return [...this.patients]
  }

  getResources() {
    return {
      total: { ...this.resources.total },
      available: { ...this.resources.available },
    }
  }

  addPatient(patient: Omit<Patient, "id" | "status" | "resourcesAllocated">): Patient {
    const newPatient: Patient = {
      id: crypto.randomUUID(),
      status: "Waiting",
      resourcesAllocated: { OT: 0, D: 0, N: 0 },
      ...patient,
    }
    this.patients.push(newPatient)
    return newPatient
  }

  updatePatient(id: string, updates: Partial<Patient>): Patient | null {
    const index = this.patients.findIndex((p) => p.id === id)
    if (index === -1) return null

    const oldPatient = this.patients[index]
    const wasTreated = oldPatient.status === "Treated"
    const willBeTreated = updates.status === "Treated"

    this.patients[index] = { ...this.patients[index], ...updates }

    // If status changed to "Treated", release resources
    if (!wasTreated && willBeTreated) {
      const patient = this.patients[index]
      this.resources.available = {
        OT: this.resources.available.OT + patient.resourcesAllocated.OT,
        D: this.resources.available.D + patient.resourcesAllocated.D,
        N: this.resources.available.N + patient.resourcesAllocated.N,
      }
      this.patients[index].resourcesAllocated = { OT: 0, D: 0, N: 0 }
    }

    // Update available resources
    this.updateAvailableResources()

    return this.patients[index]
  }

  deletePatient(id: string): boolean {
    const index = this.patients.findIndex((p) => p.id === id)
    if (index === -1) return false

    // Release resources
    const patient = this.patients[index]
    this.resources.available = {
      OT: this.resources.available.OT + patient.resourcesAllocated.OT,
      D: this.resources.available.D + patient.resourcesAllocated.D,
      N: this.resources.available.N + patient.resourcesAllocated.N,
    }

    this.patients.splice(index, 1)
    this.updateAvailableResources()

    return true
  }

  setPatientAllocation(id: string, allocation: Partial<ResourceVector>): Patient | null {
    const patient = this.patients.find((p) => p.id === id)
    if (!patient) return null

    const newAllocation: ResourceVector = {
      OT: allocation.OT ?? patient.resourcesAllocated.OT,
      D: allocation.D ?? patient.resourcesAllocated.D,
      N: allocation.N ?? patient.resourcesAllocated.N,
    }

    return this.updatePatient(id, { resourcesAllocated: newAllocation })
  }

  setResourceTotals(totals: ResourceVector): void {
    this.resources.total = { ...totals }
    this.updateAvailableResources()
  }

  private updateAvailableResources(): void {
    const sumAlloc = this.patients.reduce<ResourceVector>(
      (acc, p) => {
        acc.OT += p.resourcesAllocated.OT
        acc.D += p.resourcesAllocated.D
        acc.N += p.resourcesAllocated.N
        return acc
      },
      { OT: 0, D: 0, N: 0 },
    )

    this.resources.available = {
      OT: this.resources.total.OT - sumAlloc.OT,
      D: this.resources.total.D - sumAlloc.D,
      N: this.resources.total.N - sumAlloc.N,
    }
  }

  reset(): void {
    this.patients = []
    this.resources = {
      total: { ...defaultTotals },
      available: { ...defaultTotals },
    }
  }
}

// Singleton instance
export const hospitalStore = new HospitalStore()


