import type { ResourceVector } from "@/components/hosp-os/state"

interface ResourcesState {
  total: ResourceVector
  available: ResourceVector
}

interface Row {
  id: string
  name: string
  severity: any
  alloc: ResourceVector
  max: ResourceVector
  need: ResourceVector
}

export interface SafeStateResult {
  safe: boolean
  safeSequence: string[]
}

const RES: (keyof ResourceVector)[] = ["OT", "D", "N"]

export function isSafeState(
  resources: ResourcesState,
  rows: Row[],
  requestPid: string,
  request: ResourceVector,
): SafeStateResult {
  // Clone available
  const work: ResourceVector = { ...resources.available }

  // Apply request if feasible: Request <= Need and Request <= Available
  const idx = rows.findIndex((r) => r.id === requestPid)
  if (idx === -1) return { safe: false, safeSequence: [] }
  const row = rows[idx]
  for (const k of RES) {
    if (request[k] > row.need[k]) return { safe: false, safeSequence: [] }
    if (request[k] > work[k]) return { safe: false, safeSequence: [] }
  }

  // Tentatively allocate
  const alloc: Row[] = rows.map((r) => ({ ...r, alloc: { ...r.alloc }, need: { ...r.need } }))
  for (const k of RES) {
    alloc[idx].alloc[k] += request[k]
    alloc[idx].need[k] -= request[k]
    work[k] -= request[k]
  }

  // Safety algorithm
  const finished: Record<string, boolean> = {}
  const safeSeq: string[] = []

  let progress = true
  while (progress) {
    progress = false
    for (const r of alloc) {
      if (finished[r.id]) continue
      if (RES.every((k) => r.need[k] <= work[k])) {
        // Can finish this process
        for (const k of RES) {
          work[k] += r.alloc[k]
        }
        finished[r.id] = true
        safeSeq.push(r.id)
        progress = true
      }
    }
  }

  const safe = alloc.every((r) => finished[r.id] === true)
  return { safe, safeSequence: safe ? safeSeq : [] }
}
