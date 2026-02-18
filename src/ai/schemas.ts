import { z } from 'zod'

// Frontend copy of API schemas (api/src/schemas/index.ts).
// Duplicated to avoid cross-package imports and keep the build simple.

export const AIWorkItemSchema = z.object({
  title: z.string(),
  notes: z.string(),
  best_case_hours: z.number(),
  worst_case_hours: z.number(),
  groupName: z.string(),
})

export const AIStaffingRoleSchema = z.object({
  discipline: z.string(),
  hourly_rate: z.number(),
  count: z.number(),
})

export const GenerateEstimateResponseSchema = z.object({
  workItems: z.array(AIWorkItemSchema),
  staffingRoles: z.array(AIStaffingRoleSchema),
  assumptions: z.array(z.string()),
  reasoning: z.string(),
})

export const AnalyzeEstimateResponseSchema = z.object({
  riskAssessment: z.object({
    overallRisk: z.enum(['low', 'medium', 'high']),
    summary: z.string(),
    items: z.array(z.object({
      itemTitle: z.string(),
      concern: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
      suggestion: z.string(),
    })),
    missingCategories: z.array(z.string()),
  }),
  staffingObservations: z.object({
    summary: z.string(),
    concerns: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
  communicationGuide: z.object({
    executiveSummary: z.string(),
    confidenceLevels: z.object({
      p50: z.string(),
      p84: z.string(),
      p97: z.string(),
    }),
    talkingPoints: z.array(z.string()),
    caveats: z.array(z.string()),
  }),
  suggestions: z.array(z.object({
    action: z.string(),
    rationale: z.string(),
  })),
})

export type AIWorkItem = z.infer<typeof AIWorkItemSchema>
export type AIStaffingRole = z.infer<typeof AIStaffingRoleSchema>
export type GenerateEstimateResponse = z.infer<typeof GenerateEstimateResponseSchema>
export type AnalyzeEstimateResponse = z.infer<typeof AnalyzeEstimateResponseSchema>
