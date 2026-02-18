import { z } from 'zod'

// What the AI returns for estimate generation
export const AIWorkItemSchema = z.object({
  title: z.string().describe('Short name for the work item (2-6 words)'),
  notes: z.string().describe('Brief description of what this entails'),
  best_case_hours: z.number().describe('Optimistic estimate in hours'),
  worst_case_hours: z.number().describe('Pessimistic estimate in hours'),
  groupName: z.string().describe('Category/group this item belongs to'),
})

export const AIStaffingRoleSchema = z.object({
  discipline: z.string().describe('Role title, e.g. "Senior Developer"'),
  hourly_rate: z.number().describe('Suggested hourly rate in USD'),
  count: z.number().describe('Number of people in this role'),
})

export const GenerateEstimateResponseSchema = z.object({
  workItems: z.array(AIWorkItemSchema),
  staffingRoles: z.array(AIStaffingRoleSchema),
  assumptions: z.array(z.string()).describe('Key assumptions made'),
  reasoning: z.string().describe('Explanation of estimation approach'),
})

// What the AI returns for estimate analysis
export const RiskItemSchema = z.object({
  itemTitle: z.string(),
  concern: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  suggestion: z.string(),
})

export const AnalyzeEstimateResponseSchema = z.object({
  riskAssessment: z.object({
    overallRisk: z.enum(['low', 'medium', 'high']),
    summary: z.string(),
    items: z.array(RiskItemSchema),
    missingCategories: z.array(z.string()),
  }),
  staffingObservations: z.object({
    summary: z.string(),
    concerns: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
  communicationGuide: z.object({
    executiveSummary: z.string().describe('1-2 paragraph stakeholder summary'),
    confidenceLevels: z.object({
      p50: z.string().describe('What to say at 50th percentile'),
      p84: z.string().describe('What to say at 84th percentile'),
      p97: z.string().describe('What to say at 97th percentile'),
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
