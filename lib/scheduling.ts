import type { Patient, ResourceVector, Severity } from "@/components/hosp-os/state"

export type SchedulingAlgo = "FCFS" | "SJF" | "RR" | "PRIORITY"

export interface SchedulingSegment {
  patientId: string
  patientName: string
  severity: Severity
  start: number
  end: number
}

export interface UtilizationPoint extends ResourceVector {
  time: number
}

export interface SchedulingResult {
  segments: SchedulingSegment[]
  averageWaitingTime: number
  totalProcessed: number
  throughput: number
  utilization: UtilizationPoint[]
}

export function runScheduling(patients: Patient[], algo: SchedulingAlgo, quantum?: number): SchedulingResult {
  const ready = [...patients].map((p) => ({
    id: p.id,
    name: p.name,
    severity: p.severity,
    arrival: p.arrivalTime,
    burst: p.burstTime,
    remaining: p.burstTime,
    needs: p.resourcesNeeded,
  }))

  const segments: SchedulingSegment[] = []
  let time = Math.min(...ready.map((p) => p.arrival))
  if (!isFinite(time)) time = 0

  switch (algo) {
    case "FCFS":
      fcfs(ready, time, segments)
      break
    case "SJF":
      sjf(ready, time, segments)
      break
    case "RR":
      rr(ready, time, segments, quantum ?? 1)
      break
    case "PRIORITY":
      priority(ready, time, segments)
      break
  }

  // Compute waiting time: completion - arrival - burst
  const completion: Record<string, number> = {}
  const firstStart: Record<string, number> = {}
  for (const seg of segments) {
    completion[seg.patientId] = seg.end
    if (!(seg.patientId in firstStart)) firstStart[seg.patientId] = seg.start
  }
  const byId = Object.fromEntries(ready.map((p) => [p.id, p]))
  const waitingTimes = Object.keys(byId).map((id) => {
    const p = byId[id]
    const wt = (firstStart[id] ?? 0) - p.arrival
    return Math.max(0, wt)
  })
  const averageWaitingTime = waitingTimes.length ? waitingTimes.reduce((a, b) => a + b, 0) / waitingTimes.length : 0

  const totalProcessed = ready.length
  const makespan = segments.length
    ? Math.max(...segments.map((s) => s.end)) - Math.min(...segments.map((s) => s.start))
    : 0
  const throughput = makespan > 0 ? (totalProcessed / makespan) * 60 /* per hour */ : 0

  const utilization = buildUtilization(segments, byId)

  return { segments, averageWaitingTime, totalProcessed, throughput, utilization }
}

function fcfs(ready: ReturnType<typeof normalize>[], startTime: number, segments: SchedulingSegment[]) {
  let t = startTime
  const q = [...ready].sort((a, b) => a.arrival - b.arrival)
  for (const p of q) {
    if (t < p.arrival) t = p.arrival
    segments.push(seg(p, t, t + p.burst))
    t += p.burst
  }
}

function sjf(ready: ReturnType<typeof normalize>[], startTime: number, segments: SchedulingSegment[]) {
  let t = startTime
  const arrived: ReturnType<typeof normalize>[] = []
  const pending = [...ready].sort((a, b) => a.arrival - b.arrival)
  while (arrived.length || pending.length) {
    while (pending.length && pending[0].arrival <= t) {
      arrived.push(pending.shift()!)
    }
    if (!arrived.length) {
      t = pending[0].arrival
      continue
    }
    arrived.sort((a, b) => a.burst - b.burst)
    const p = arrived.shift()!
    segments.push(seg(p, t, t + p.burst))
    t += p.burst
  }
}

function rr(ready: ReturnType<typeof normalize>[], startTime: number, segments: SchedulingSegment[], quantum: number) {
  let t = startTime
  const pending = [...ready].sort((a, b) => a.arrival - b.arrival)
  const queue: ReturnType<typeof normalize>[] = []
  while (pending.length || queue.length) {
    while (pending.length && pending[0].arrival <= t) queue.push(pending.shift()!)
    if (!queue.length) {
      // jump to next arrival
      t = pending[0].arrival
      continue
    }
    const p = queue.shift()!
    const run = Math.min(quantum, p.remaining)
    segments.push(seg(p, t, t + run))
    t += run
    p.remaining -= run
    // enqueue newly arrived during this time slice
    while (pending.length && pending[0].arrival <= t) queue.push(pending.shift()!)
    if (p.remaining > 0) queue.push(p)
  }
}

function priority(ready: ReturnType<typeof normalize>[], startTime: number, segments: SchedulingSegment[]) {
  // Lower numeric priority value means higher precedence: P1 > P2 > P3
  const priVal: Record<Severity, number> = { P1: 1, P2: 2, P3: 3 }
  let t = startTime
  const arrived: ReturnType<typeof normalize>[] = []
  const pending = [...ready].sort((a, b) => a.arrival - b.arrival)
  while (arrived.length || pending.length) {
    while (pending.length && pending[0].arrival <= t) {
      arrived.push(pending.shift()!)
    }
    if (!arrived.length) {
      t = pending[0].arrival
      continue
    }
    arrived.sort((a, b) => priVal[a.severity] - priVal[b.severity] || a.arrival - b.arrival)
    const p = arrived.shift()!
    segments.push(seg(p, t, t + p.burst))
    t += p.burst
  }
}

// utilities

function normalize(p: Patient) {
  return {
    id: p.id,
    name: p.name,
    severity: p.severity,
    arrival: p.arrivalTime,
    burst: p.burstTime,
    remaining: p.burstTime,
    needs: p.resourcesNeeded,
  }
}

function seg(p: ReturnType<typeof normalize>, start: number, end: number): SchedulingSegment {
  return { patientId: p.id, patientName: p.name, severity: p.severity, start, end }
}

function buildUtilization(
  segments: SchedulingSegment[],
  byId: Record<string, ReturnType<typeof normalize>>,
): UtilizationPoint[] {
  if (!segments.length) return []
  // Collect discrete time points
  const times = Array.from(new Set(segments.flatMap((s) => [s.start, s.end]))).sort((a, b) => a - b)
  const result: UtilizationPoint[] = []
  for (const t of times) {
    // sum resourcesNeeded for segments active at time t
    const active = segments.filter((s) => s.start <= t && t < s.end)
    const sum = active.reduce<ResourceVector>(
      (acc, s) => {
        const needs = byId[s.patientId].needs
        acc.OT += needs.OT
        acc.D += needs.D
        acc.N += needs.N
        return acc
      },
      { OT: 0, D: 0, N: 0 },
    )
    result.push({ time: t, ...sum })
  }
  return result
}
