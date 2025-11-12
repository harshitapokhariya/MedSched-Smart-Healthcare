/**
 * API Service Layer for Flask Backend Integration
 * All API calls to the backend are centralized here
 */

const API_BASE_URL = 'http://localhost:5000'

export interface Patient {
  id: string
  name: string
  arrivalTime: number
  severity: "P1" | "P2" | "P3"
  burstTime: number
  resourcesNeeded: { OT: number; D: number; N: number }
  resourcesAllocated: { OT: number; D: number; N: number }
  status: "Waiting" | "Scheduled" | "Treated"
}

export interface ResourcesState {
  total: { OT: number; D: number; N: number }
  available: { OT: number; D: number; N: number }
}

export interface HospitalState {
  patients: Patient[]
  resources: ResourcesState
}

export interface SchedulingResult {
  segments: Array<{
    patientId: string
    patientName: string
    severity: "P1" | "P2" | "P3"
    start: number
    end: number
  }>
  averageWaitingTime: number
  totalProcessed: number
  throughput: number
  utilization: Array<{ time: number; OT: number; D: number; N: number }>
}

export interface SafeStateResult {
  safe: boolean
  safeSequence: string[]
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new ApiError(response.status, error.error || response.statusText)
  }
  return response.json()
}

export const api = {
  // Patient Operations
  async getPatients(): Promise<HospitalState> {
    const response = await fetch(`${API_BASE_URL}/api/patients`)
    return handleResponse<HospitalState>(response)
  },

  async createPatient(patient: Omit<Patient, "id" | "status" | "resourcesAllocated">): Promise<{ patient: Patient }> {
    const response = await fetch(`${API_BASE_URL}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    })
    return handleResponse<{ patient: Patient }>(response)
  },

  async updatePatient(id: string, updates: Partial<Patient>): Promise<{ patient: Patient }> {
    const response = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    return handleResponse<{ patient: Patient }>(response)
  },

  async deletePatient(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
      method: 'DELETE',
    })
    return handleResponse<{ success: boolean }>(response)
  },

  async allocateResources(
    patientId: string,
    allocation: { OT?: number; D?: number; N?: number }
  ): Promise<{ patient: Patient; resources: ResourcesState }> {
    const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allocation }),
    })
    return handleResponse<{ patient: Patient; resources: ResourcesState }>(response)
  },

  // Scheduling Operations
  async runScheduling(
    algorithm: "FCFS" | "SJF" | "RR" | "PRIORITY",
    patients: Patient[],
    quantum?: number
  ): Promise<{ result: SchedulingResult }> {
    const response = await fetch(`${API_BASE_URL}/api/scheduling`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        algorithm,
        patients,
        quantum,
      }),
    })
    return handleResponse<{ result: SchedulingResult }>(response)
  },

  // Banker's Algorithm
  async checkSafetyState(
    patientId: string,
    request: { OT: number; D: number; N: number }
  ): Promise<{ result: SafeStateResult }> {
    const response = await fetch(`${API_BASE_URL}/api/bankers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, request }),
    })
    return handleResponse<{ result: SafeStateResult }>(response)
  },

  // Resources
  async getResources(): Promise<{ resources: ResourcesState }> {
    const response = await fetch(`${API_BASE_URL}/api/resources`)
    return handleResponse<{ resources: ResourcesState }>(response)
  },
}


