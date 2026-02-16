import type { AppState } from '../types'

interface SessionFile {
  version: number
  exportedAt: string
  state: AppState
}

export function exportSession(state: AppState): string {
  const file: SessionFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
  }
  return JSON.stringify(file, null, 2)
}

export function importSession(json: string): AppState {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Invalid JSON')
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Expected a JSON object')
  }

  const file = parsed as Record<string, unknown>
  if (typeof file.version !== 'number') {
    throw new Error('Missing or invalid version field')
  }

  const state = file.state
  if (typeof state !== 'object' || state === null) {
    throw new Error('Missing state field')
  }

  const s = state as Record<string, unknown>

  // Validate workItems
  if (!Array.isArray(s.workItems)) {
    throw new Error('Missing workItems array')
  }
  for (const item of s.workItems) {
    if (typeof item !== 'object' || item === null) {
      throw new Error('Invalid work item')
    }
    const wi = item as Record<string, unknown>
    if (typeof wi.id !== 'number') throw new Error('Work item missing id')
    if (typeof wi.best_case_hours !== 'number') throw new Error('Work item missing best_case_hours')
    if (typeof wi.worst_case_hours !== 'number') throw new Error('Work item missing worst_case_hours')
    // Backfill optional fields
    if (typeof wi.title !== 'string') wi.title = ''
    if (typeof wi.notes !== 'string') wi.notes = ''
    if (typeof wi.enabled !== 'boolean') wi.enabled = true
    if (typeof wi.multiplier !== 'number' || wi.multiplier < 1) wi.multiplier = 1
  }

  // Validate constants
  if (typeof s.constants !== 'object' || s.constants === null) {
    throw new Error('Missing constants object')
  }

  // Validate nextId
  if (typeof s.nextId !== 'number') {
    throw new Error('Missing nextId')
  }

  // Backfill staffing
  if (typeof s.staffing !== 'object' || s.staffing === null) {
    s.staffing = { rows: [], week_count: 0, nextRowId: 1 }
  } else {
    const st = s.staffing as Record<string, unknown>
    if (!Array.isArray(st.rows)) st.rows = []
    if (typeof st.week_count !== 'number') st.week_count = 0
    if (typeof st.nextRowId !== 'number') st.nextRowId = 1
  }

  return state as AppState
}

export function triggerDownload(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
