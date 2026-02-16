import { describe, it, expect } from 'vitest'
import { exportSession, importSession } from './serialization'
import type { AppState } from '../types'

const sampleState: AppState = {
  workItems: [
    { id: 1, title: 'Task A', notes: '', best_case_hours: 10, worst_case_hours: 20, enabled: true, multiplier: 1 },
    { id: 2, title: 'Task B', notes: 'some notes', best_case_hours: 5, worst_case_hours: 15, enabled: false, multiplier: 3 },
  ],
  constants: {
    expected_case_position: 0.6,
    range_spread_divisor: 2.6,
    billable_hours_per_week: 36,
    duration_scaling_power: 3.2,
    coordination_cost_per_pair: 1,
  },
  nextId: 3,
  staffing: {
    rows: [
      { id: 1, discipline: 'Dev', hourly_rate: 150, cells: ['40', '40', ''], enabled: true, multiplier: 2 },
    ],
    week_count: 3,
    nextRowId: 2,
  },
}

describe('serialization', () => {
  describe('round-trip', () => {
    it('exports and re-imports to equivalent state', () => {
      const json = exportSession(sampleState)
      const result = importSession(json)
      expect(result).toEqual(sampleState)
    })

    it('export includes version and exportedAt', () => {
      const json = exportSession(sampleState)
      const parsed = JSON.parse(json)
      expect(parsed.version).toBe(1)
      expect(parsed.exportedAt).toBeTruthy()
    })
  })

  describe('importSession validation', () => {
    it('rejects invalid JSON', () => {
      expect(() => importSession('not json')).toThrow('Invalid JSON')
    })

    it('rejects non-object', () => {
      expect(() => importSession('"string"')).toThrow('Expected a JSON object')
    })

    it('rejects missing version', () => {
      expect(() => importSession('{"state": {}}')).toThrow('Missing or invalid version')
    })

    it('rejects missing state', () => {
      expect(() => importSession('{"version": 1}')).toThrow('Missing state field')
    })

    it('rejects missing workItems', () => {
      expect(() => importSession(JSON.stringify({
        version: 1,
        state: { constants: {}, nextId: 1 },
      }))).toThrow('Missing workItems array')
    })

    it('rejects work item missing id', () => {
      expect(() => importSession(JSON.stringify({
        version: 1,
        state: {
          workItems: [{ best_case_hours: 1, worst_case_hours: 2 }],
          constants: {},
          nextId: 1,
        },
      }))).toThrow('Work item missing id')
    })

    it('rejects missing constants', () => {
      expect(() => importSession(JSON.stringify({
        version: 1,
        state: { workItems: [], nextId: 1 },
      }))).toThrow('Missing constants object')
    })

    it('rejects missing nextId', () => {
      expect(() => importSession(JSON.stringify({
        version: 1,
        state: { workItems: [], constants: {} },
      }))).toThrow('Missing nextId')
    })
  })

  describe('backfill defaults', () => {
    it('backfills missing staffing with defaults', () => {
      const json = JSON.stringify({
        version: 1,
        state: {
          workItems: [],
          constants: { expected_case_position: 0.6, range_spread_divisor: 2.6, billable_hours_per_week: 36, duration_scaling_power: 3.2, coordination_cost_per_pair: 1 },
          nextId: 1,
        },
      })
      const result = importSession(json)
      expect(result.staffing).toEqual({ rows: [], week_count: 0, nextRowId: 1 })
    })

    it('backfills missing work item optional fields', () => {
      const json = JSON.stringify({
        version: 1,
        state: {
          workItems: [{ id: 1, best_case_hours: 5, worst_case_hours: 10 }],
          constants: { expected_case_position: 0.6, range_spread_divisor: 2.6, billable_hours_per_week: 36, duration_scaling_power: 3.2, coordination_cost_per_pair: 1 },
          nextId: 2,
        },
      })
      const result = importSession(json)
      expect(result.workItems[0]).toEqual({
        id: 1,
        title: '',
        notes: '',
        best_case_hours: 5,
        worst_case_hours: 10,
        enabled: true,
        multiplier: 1,
      })
    })
  })
})
