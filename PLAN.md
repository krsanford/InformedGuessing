# AI Integration Implementation Plan

## Overview

Add two AI-powered features to Rough Math:
1. **AI Estimate Generator** — Describe a project (text + uploaded docs), AI generates work items + staffing plan
2. **AI Estimate Advisor** — AI analyzes a completed estimate, provides risk insights + communication guidance

Architecture: Azure Functions backend (managed by SWA) → Azure OpenAI (GPT-4o-mini) with structured outputs via Zod. Frontend uses Vercel AI SDK `useObject` for streaming typed JSON. Document extraction via free npm libs with Azure Document Intelligence as OCR fallback.

---

## Phase 1: Backend Infrastructure

### 1.1 Create Azure Functions project

Create `api/` folder at project root with Azure Functions v4 (Node.js, TypeScript):

```
api/
├── src/
│   ├── functions/
│   │   ├── generateEstimate.ts    # POST /api/generate-estimate
│   │   └── analyzeEstimate.ts     # POST /api/analyze-estimate
│   ├── lib/
│   │   ├── openai.ts              # Azure OpenAI client (shared)
│   │   ├── documentExtractor.ts   # File → text extraction
│   │   └── prompts.ts             # System prompts for each feature
│   └── schemas/
│       └── index.ts               # Shared Zod schemas (AI response shapes)
├── package.json                   # Separate package.json for API deps
├── tsconfig.json                  # Separate tsconfig for Node.js target
├── host.json                      # Azure Functions host config
└── local.settings.json            # Local dev env vars (gitignored)
```

**Dependencies (api/package.json):**
- `ai` — Vercel AI SDK core (server-side `streamObject`)
- `@ai-sdk/azure` — Azure OpenAI provider for AI SDK
- `zod` — Schema definitions (shared with frontend)
- `pdf-parse` — PDF text extraction (free, no OCR)
- `mammoth` — DOCX → text extraction
- `officeparser` — XLSX/PPTX text extraction
- `@azure-rest/ai-document-intelligence` — OCR fallback for scanned PDFs
- `@azure/identity` — Managed Identity auth (DefaultAzureCredential)
- `@azure/functions` — Azure Functions SDK v4

### 1.2 Shared Zod schemas (api/src/schemas/index.ts)

These schemas define the AI's structured output — guaranteed valid JSON:

```typescript
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
```

### 1.3 Azure OpenAI client (api/src/lib/openai.ts)

```typescript
import { createAzure } from '@ai-sdk/azure'

export const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  // Future: replace apiKey with Managed Identity
})
```

Start with API key auth for simplicity. Phase 2 upgrade to Managed Identity (`DefaultAzureCredential`).

### 1.4 Document extractor (api/src/lib/documentExtractor.ts)

Hybrid approach — free npm libs first, Azure Doc Intelligence fallback:

```typescript
async function extractText(buffer: Buffer, mimeType: string): Promise<string>
```

- `application/pdf` → `pdf-parse`. If result < 50 chars, fall back to Azure Document Intelligence Read model
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` → `mammoth.extractRawText()`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` → `officeparser`
- `application/vnd.openxmlformats-officedocument.presentationml.presentation` → `officeparser`
- `text/plain`, `text/markdown` → pass through as UTF-8
- Reject other types with descriptive error

### 1.5 Generate Estimate endpoint (api/src/functions/generateEstimate.ts)

```
POST /api/generate-estimate
Content-Type: multipart/form-data

Fields:
  - prompt: string (project description)
  - files: File[] (optional uploaded documents)

Response: streaming JSON (text/event-stream)
  → GenerateEstimateResponseSchema streamed as partial objects
```

Implementation:
1. Parse multipart form (prompt + files)
2. Extract text from each uploaded file via documentExtractor
3. Construct system prompt + user prompt with extracted context
4. Call `streamObject()` with Azure OpenAI GPT-4o-mini + GenerateEstimateResponseSchema
5. Return `result.toTextStreamResponse()`

### 1.6 Analyze Estimate endpoint (api/src/functions/analyzeEstimate.ts)

```
POST /api/analyze-estimate
Content-Type: application/json

Body: {
  workItems: WorkItem[],
  groups: WorkItemGroup[],
  constants: EstimationConstants,
  results: PortfolioResults,
  staffing: { rows: StaffingRow[], week_count: number },
  gapDecomposition: GapDecomposition | null
}

Response: streaming JSON (text/event-stream)
  → AnalyzeEstimateResponseSchema streamed as partial objects
```

Implementation:
1. Parse JSON body containing full estimate context
2. Construct system prompt with domain expertise + user context
3. Call `streamObject()` with Azure OpenAI GPT-4o (better prose) + AnalyzeEstimateResponseSchema
4. Return `result.toTextStreamResponse()`

### 1.7 System prompts (api/src/lib/prompts.ts)

Two carefully crafted system prompts:

**GENERATE_ESTIMATE_PROMPT:** You are a senior technical project manager and estimation expert. You specialize in breaking vague project scopes into concrete, estimable work items using two-point estimation (best-case/worst-case hours). [Include guidance on: granularity (4-80 hours per item), common categories to consider (dev, testing, design, infra, PM), how to handle uncertainty, grouping strategy, staffing role suggestions, etc.]

**ANALYZE_ESTIMATE_PROMPT:** You are a senior delivery lead reviewing a software project estimate. You have deep experience with estimation accuracy, risk management, team dynamics (Brooks's Law), and stakeholder communication. [Include guidance on: what to look for in estimates, common blind spots, how confidence levels work in this tool, how to communicate uncertainty to stakeholders, etc.]

### 1.8 Update SWA config

Update `staticwebapp.config.json`:
- Add API route for `/api/*` (handled automatically by SWA managed functions)
- Update CSP to allow `connect-src 'self'` for API calls

### 1.9 Update GitHub Actions

Update the workflow to:
- Install API dependencies: `cd api && pnpm install`
- Set `api_location: "/api"` in the deploy step (SWA builds functions separately)
- Add environment variables for Azure OpenAI resource name + key via GitHub secrets

### 1.10 Local development

- `api/local.settings.json` (gitignored) with Azure OpenAI credentials
- SWA CLI (`npx @azure/static-web-apps-cli start`) to run frontend + API together locally
- Add dev scripts to root package.json: `"dev:swa": "swa start http://localhost:5173 --api-location ./api"`

---

## Phase 2: AI Estimate Generator (Feature 1)

### 2.1 Frontend dependencies

Add to root `package.json`:
- `@ai-sdk/react` — React hooks (`useObject`) for streaming structured output
- `zod` — Schema definitions (shared with backend)

### 2.2 Shared schema module

Create `src/ai/schemas.ts` — TypeScript types inferred from Zod schemas. These are the same schemas defined in the API but importable by the frontend for type inference. (We duplicate rather than share across package boundaries to keep the build simple.)

### 2.3 AIAssistPanel component

New file: `src/components/ai/AIAssistPanel.tsx` + `AIAssistPanel.module.css`

**UX flow:**
1. User clicks "AI Assist" button (sparkle icon) in the Work Items section header
2. A modal/overlay panel slides in with:
   - Large text area: "Describe your project, feature, or scope of work..."
   - File upload zone: "Attach documents (PDF, Word, Excel, PowerPoint)" — drag-and-drop + click
   - "Generate Estimate" button (amber gradient, matching existing add button style)
3. On submit:
   - Button shows loading state with pulsing animation
   - `useObject` hook streams the response
   - Work items appear one-by-one in a preview list below the input
   - Staffing roles appear in a separate section
   - Assumptions and reasoning appear in a collapsible details section
4. Preview state:
   - Each work item has a checkbox (checked by default) for accept/reject
   - User can edit titles/hours inline before accepting
   - "Accept Selected" button commits checked items to the main estimate
   - "Discard" button closes the panel

**Styling:** Matches existing design system — indigo borders, ivory background, monospace numbers, CSS Modules, tokens.css variables.

### 2.4 File upload handling

New file: `src/components/ai/FileUploadZone.tsx` + `FileUploadZone.module.css`

- Drag-and-drop zone with visual feedback
- Click to browse
- Shows file list with names, sizes, remove buttons
- Accepts: .pdf, .docx, .xlsx, .pptx, .txt, .md
- Max file size: 10MB per file, 30MB total
- Client-side validation before upload

### 2.5 useAIEstimate hook

New file: `src/hooks/useAIEstimate.ts`

Wraps `useObject` from `@ai-sdk/react`:

```typescript
import { experimental_useObject as useObject } from '@ai-sdk/react'
import { GenerateEstimateResponseSchema } from '../ai/schemas'

export function useAIEstimate() {
  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/generate-estimate',
    schema: GenerateEstimateResponseSchema,
  })

  return { estimate: object, generate: submit, isLoading, stop, error }
}
```

For file uploads, the hook will use a custom `fetch` call (since `useObject` doesn't handle multipart natively), parse the SSE stream manually, and feed partial objects through state.

### 2.6 AI import reducer actions

Add to `types.ts`:
```typescript
| { type: 'AI_IMPORT_ITEMS'; items: Array<{ title: string; notes: string; best_case_hours: number; worst_case_hours: number; groupName: string }> }
| { type: 'AI_IMPORT_STAFFING'; roles: Array<{ discipline: string; hourly_rate: number; count: number }>; weekCount: number }
```

Add to `reducer.ts`:
- `AI_IMPORT_ITEMS`: Creates groups from unique groupNames, creates WorkItems with groupId assignments, assigns IDs from nextId/nextGroupId
- `AI_IMPORT_STAFFING`: Creates StaffingRows from roles (one row per person), sets week_count, assigns IDs from nextRowId

### 2.7 Integration with App.tsx

- Add `aiPanelOpen` state (boolean)
- Add "AI Assist" button in the Work Items section header (next to "+ Add Work Item")
- Render `<AIAssistPanel>` conditionally
- Pass dispatch to panel for committing accepted items
- After AI import, existing calculations/visualizations light up automatically (no special handling needed — the reducer produces standard WorkItem[] and StaffingRow[])

### 2.8 SparkleIcon

New file: `src/components/icons/SparkleIcon.tsx` — SVG sparkle/magic wand icon for the AI button.

---

## Phase 3: AI Estimate Advisor (Feature 2)

### 3.1 Analyze endpoint hook

New file: `src/hooks/useAIAdvisor.ts`

```typescript
export function useAIAdvisor() {
  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/analyze-estimate',
    schema: AnalyzeEstimateResponseSchema,
  })

  return { analysis: object, analyze: submit, isLoading, stop, error }
}
```

### 3.2 AIAdvisorPanel component

New file: `src/components/ai/AIAdvisorPanel.tsx` + `AIAdvisorPanel.module.css`

**Placement:** Rendered after InsightsPanel in the main content area. Only visible when there are work items with valid results.

**UX flow:**
1. User clicks "AI Analysis" button (visible when estimate has ≥2 work items with ranges)
2. Sends full estimate context (work items, groups, staffing, results, gap decomposition) to `/api/analyze-estimate`
3. Streams response into structured sections:

**Section layout (each in a card with `<details>/<summary>` matching InsightsPanel pattern):**

a. **Risk Assessment**
   - Overall risk badge (low/medium/high with color coding)
   - Summary paragraph
   - Risk items as a list with severity indicators
   - Missing categories callout

b. **Staffing Observations**
   - Summary paragraph
   - Concerns as warning callouts
   - Suggestions as action items

c. **Communication Guide**
   - Executive summary (with copy-to-clipboard button)
   - Confidence level tabs (50th / 84th / 97th percentile)
   - Talking points as bullet list
   - Caveats as italic callouts

d. **Suggestions**
   - Action cards with rationale

### 3.3 Integration with App.tsx

- Render `<AIAdvisorPanel>` after `<InsightsPanel>` in the main content
- Pass: workItems, groups, constants, results, staffing state, gapDecomposition
- Component internally handles the submit/stream/display lifecycle

---

## Phase 4: Infrastructure & DevOps

### 4.1 Azure resources to provision

1. **Azure OpenAI Service** resource (or upgrade existing to Foundry)
   - Region: East US (or nearest with GPT-4o-mini availability)
   - Deploy model: `gpt-4o-mini` (for estimate generation)
   - Deploy model: `gpt-4o` (for estimate analysis — better prose)
   - Deployment type: Global Standard (pay-as-you-go)

2. **Azure Document Intelligence** resource (for scanned PDF OCR fallback)
   - Tier: F0 (free — 500 pages/month)
   - Region: same as OpenAI resource

3. **Azure SWA** — already exists, just needs API configuration

### 4.2 Environment variables

GitHub Secrets (for CI/CD):
- `AZURE_OPENAI_RESOURCE_NAME`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT` (e.g., "gpt-4o-mini")
- `AZURE_OPENAI_GPT4O_DEPLOYMENT` (e.g., "gpt-4o")
- `AZURE_DOC_INTELLIGENCE_ENDPOINT`
- `AZURE_DOC_INTELLIGENCE_KEY`

Azure SWA Application Settings (for runtime):
- Same variables as above, configured in Azure Portal

### 4.3 Updated GitHub Actions workflow

```yaml
steps:
  # ... existing checkout, pnpm setup, node setup ...
  - name: Install frontend dependencies
    run: pnpm install
  - name: Install API dependencies
    run: cd api && pnpm install
  - name: Run tests
    run: pnpm vitest run
  - name: Build frontend
    run: pnpm run build
  - name: Deploy
    uses: Azure/static-web-apps-deploy@v1
    with:
      azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_PROUD_BEACH_0C6C9240F }}
      action: "upload"
      app_location: "/dist"
      api_location: "/api"          # NEW: point to API folder
      skip_app_build: true
      skip_api_build: false         # Let SWA build the API
      github_id_token: ${{ steps.idtoken.outputs.result }}
```

### 4.4 CSP update

Update `staticwebapp.config.json` CSP:
```json
"content-security-policy": "default-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self';"
```

(connect-src 'self' allows fetch to /api/* endpoints on same origin)

---

## Implementation Order (Multi-Chat)

Breaking into 4 focused chats to avoid context exhaustion. Use pnpm everywhere.

### Chat 1: API Backend (Steps 1-4) — DONE
- [x] api/ scaffolding: package.json, tsconfig.json, host.json, local.settings.json
- [x] Zod schemas: api/src/schemas/index.ts
- [x] OpenAI client: api/src/lib/openai.ts
- [x] System prompts: api/src/lib/prompts.ts
- [x] generateEstimate endpoint: api/src/functions/generateEstimate.ts
- [x] .gitignore updates
- [x] **Verify:** `cd api && pnpm install && pnpm build` compiles
- **Note:** `streamObject` deprecated — using `streamText` with `experimental_output: Output.object({ schema })`

### Chat 2: Frontend State (Steps 5, 8) — DONE
- [x] Install frontend deps: ai, @ai-sdk/react, zod
- [x] Frontend schema copy: src/ai/schemas.ts
- [x] Reducer: AI_IMPORT_ITEMS action (creates groups + items)
- [x] Reducer: AI_IMPORT_STAFFING action (creates staffing rows)
- [x] Tests for new reducer actions
- **Verified:** `pnpm vitest run` — 435 tests pass
- **Note:** Installed ai@6.0.90, @ai-sdk/react@3.0.92, zod@4.3.6

### Chat 3: UI Components (Steps 6, 7, 9) — DONE
- [x] useAIEstimate hook: src/hooks/useAIEstimate.ts
- [x] AIAssistPanel + CSS: src/components/ai/AIAssistPanel.tsx
- [x] Wire into App.tsx: aiPanelOpen state, button in toolbar
- [x] App.module.css: AI button styles
- [x] Vite proxy config for local dev
- [x] SparkleIcon: src/components/icons/SparkleIcon.tsx
- **Verified:** `pnpm run build` compiles, `pnpm vitest run` — 435 tests pass
- **Note:** `useObject` returns `DeepPartial` — need type guards (`isCompleteItem`/`isCompleteRole`) before dispatching to reducer

### Chat 4: Deploy (Steps 10-11) — DONE
- [x] staticwebapp.config.json: CSP `connect-src 'self'` added
- [x] GitHub Actions: API install/build steps, `api_location: "/api"`, `skip_api_build: true`
- [ ] End-to-end verification on deployed SWA (requires Azure OpenAI secrets in GitHub)
- **Note:** Same pre-build pattern as frontend — pnpm install + build in CI, skip Oryx build
- **Note:** If pnpm symlinked node_modules cause issues on Azure, use `pnpm install --shamefully-hoist`

### Future Chats (Phase 2+)
- Document extractor: pdf-parse, mammoth, officeparser
- File upload: FileUploadZone + multipart handling
- Azure Doc Intelligence fallback for scanned PDFs
- analyzeEstimate endpoint (GPT-4o)
- AIAdvisorPanel UI
- System prompt refinement with real data

---

## File Change Summary

### New files:
```
api/
  package.json
  tsconfig.json
  host.json
  local.settings.json            (gitignored)
  src/functions/generateEstimate.ts
  src/functions/analyzeEstimate.ts
  src/lib/openai.ts
  src/lib/documentExtractor.ts
  src/lib/prompts.ts
  src/schemas/index.ts

src/ai/
  schemas.ts                     (Zod schemas for frontend type inference)

src/components/ai/
  AIAssistPanel.tsx
  AIAssistPanel.module.css
  AIAdvisorPanel.tsx
  AIAdvisorPanel.module.css
  FileUploadZone.tsx
  FileUploadZone.module.css

src/components/icons/
  SparkleIcon.tsx

src/hooks/
  useAIEstimate.ts
  useAIAdvisor.ts
```

### Modified files:
```
package.json                     (add @ai-sdk/react, zod)
src/types.ts                     (add AI_IMPORT_ITEMS, AI_IMPORT_STAFFING actions)
src/reducer.ts                   (handle new actions)
src/App.tsx                      (add AI panel state, render AIAssistPanel + AIAdvisorPanel)
src/App.module.css               (styles for AI button in section header)
staticwebapp.config.json         (CSP update for connect-src)
.github/workflows/...yml         (API build + deploy)
.gitignore                       (api/local.settings.json)
```

---

## Cost Estimate

| Component | Monthly Cost |
|---|---|
| Azure SWA (Free plan) | $0 |
| Azure Functions compute | $0 (within free grant) |
| Azure Storage | ~$1 |
| Azure OpenAI GPT-4o-mini (est. generation, ~100 req/mo) | ~$0.02 |
| Azure OpenAI GPT-4o (est. analysis, ~50 req/mo) | ~$1.50 |
| Azure Document Intelligence F0 | $0 (500 free pages/mo) |
| **Total** | **~$2.50/month** |
| **With VS/Azure credits** | **$0** |
