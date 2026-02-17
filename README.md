# Rough Math

[![Azure Static Web Apps CI/CD](https://github.com/krsanford/InformedGuessing/actions/workflows/azure-static-web-apps-proud-beach-0c6c9240f.yml/badge.svg)](https://github.com/krsanford/InformedGuessing/actions/workflows/azure-static-web-apps-proud-beach-0c6c9240f.yml)

**Hosted at [www.roughmath.com](https://www.roughmath.com)**

## Better Estimates, Better Outcomes

Ever been put on the spot for "What does it cost and how long will this take?" and wished you had a better answer than a gut feeling? Those numbers drive decisions about budgets, timelines, and whether your project gets the green light at all.

Rough Math helps you build confidence in your estimates and communicate risk to the people who control the budget. Instead of a single number that's almost certainly wrong, you capture what you actually know, a best case and a worst case for each piece of work, and the math handles the rest.

It's designed for large bodies of work on 2+ month timescales. The estimate is theoretical: expected effort, risk spread, and confidence levels derived from your inputs. The staffing plan is reality: you allocate real people to real weeks and arrive at a final staff count, duration, effort, and cost that you can feel comfortable committing to.

The math isn't new. Range-based estimation dates back to PERT in the 1950s. Rough Math adapts techniques from McConnell's *Software Estimation*, Brooks's *The Mythical Man-Month*, and Putnam & Myers' *Measures for Excellence*, grounded in variance addition and the Central Limit Theorem.

## How It Works

1. **List your work items** — features, tasks, bugs, whatever you're sizing
2. **Give two numbers per item** — best case hours and worst case hours (the range you'd feel comfortable defending)
3. **Get a defensible answer** — confidence levels, implied team size, calendar duration, and a clear picture of where the risk lives
4. **Staff against it** — build a week-by-week plan and see how it compares to the statistical estimate

A key insight: when you have many items, some will come in over estimate and others under. They partially cancel out. Your portfolio is more predictable than any single line item. Rough Math quantifies that effect so you can set commitments you can actually keep.

## Who Is This For?

- **IT Directors and Program Managers** who need to defend budget requests with more than intuition
- **Engineering Managers** who want to show why risk buffers aren't pessimism — they're informed planning
- **Anyone** who owns the answer to "What does it cost and how long will it take?"

## What It Does

- **Two-point estimation** — capture uncertainty explicitly, not as hidden padding
- **Confidence levels** — see your total at 50%, 84%, and 97% confidence so you can choose how much risk to carry
- **Duration scaling** — converts effort to calendar time, accounting for team parallelization and coordination overhead
- **Staffing grid** — allocate people to weeks with rates and costs, compare plan vs. estimate
- **Visual insights** — see where your risk is concentrated, how diversification helps, and what your buffers buy you
- **No account required** — runs entirely in your browser, nothing to install, data stays on your machine

**Try it now at [www.roughmath.com](https://www.roughmath.com)** — no signup, just start estimating.

---

## Technical Details

### Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18, TypeScript, CSS Modules |
| Build | Vite |
| Tests | Vitest, @testing-library/react |
| Drag & Drop | @dnd-kit |
| Hosting | Azure Static Web Apps |
| Package Manager | pnpm (required — not npm or yarn) |

### Architecture

All estimation math lives in pure functions under `src/domain/` with no React dependency. The UI is a thin layer on top.

```
src/
├── domain/
│   ├── estimation.ts        # Portfolio math (expected value, variance, duration)
│   ├── coordination.ts      # Brooks's Law coordination overhead
│   ├── staffing.ts          # Staffing grid calculations
│   ├── gaussian.ts          # Normal distribution PDF/CDF
│   ├── visualization.ts     # Data transforms for insight charts
│   └── serialization.ts     # Export/import with schema versioning
├── components/
│   ├── insights/            # SVG visualization components
│   ├── staffing/            # Staffing grid components
│   ├── icons/               # Icon components
│   ├── WorkItemList.tsx     # Sortable work item table
│   ├── OutputsSection.tsx   # Fixed bottom status bar
│   ├── AppHeader.tsx        # Header with settings/export controls
│   └── AdvancedVariables.tsx # Tunable estimation constants
├── hooks/                   # useAnimatedValue, usePrefersReducedMotion
├── reducer.ts               # Central state management (useReducer)
├── types.ts                 # Shared TypeScript types
└── App.tsx                  # Root component
```

### Key Math Concepts

**Two-Point Estimation.** Instead of "this will take 80 hours" (false precision), use "best case: 60 hours, worst case: 120 hours" (explicit uncertainty). The expected value is a weighted position between best and worst, controlled by the `expected_case_position` constant (default 0.6, meaning slightly pessimistic).

**Portfolio Aggregation.** Range spreads combine via root-sum-square, not linear addition. Ten items each with ±10 hours of uncertainty gives a portfolio spread of ±31.6 hours — not ±100. This is why large portfolios are proportionally more predictable.

**Duration Scaling.** Calendar duration scales with the cube root of effort: `duration = ceil(k × effort^(1/p))`, capped at `ceil(effort)` (a single person doing all the work). Doubling the effort doesn't double the timeline because you can add people, but each additional person adds coordination overhead.

**Coordination Overhead (Brooks's Law).** Adding people creates N×(N-1)/2 communication channels. The model computes incremental coordination cost beyond what's already "baked in" to a solo-developer estimate.

### Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Run tests
pnpm vitest run

# Run tests in watch mode
pnpm vitest

# Build for production
pnpm build
```

Dev server runs at http://localhost:5173/

### Testing

Tests are organized by domain layer and component layer:

| File | Tests | Coverage |
|------|-------|----------|
| `estimation.test.ts` | 33 | Core portfolio math, confidence levels, edge cases |
| `gaussian.test.ts` | 47 | PDF, CDF, curve generation, numerical accuracy |
| `visualization.test.ts` | 60 | Data transforms for all visualization types |
| `staffing.test.ts` | 57 | Cell parsing, grid calculations, row allocation, row management |
| `coordination.test.ts` | 24 | Brooks's Law coordination overhead |
| `serialization.test.ts` | 12 | Export/import with schema versioning |
| `reducer.test.ts` | 81 | All 17+ reducer actions, immutability checks |
| `OutputsSection.test.tsx` | 23 | Status bar rendering, metrics, formatting |
| `InsightsPanel.test.tsx` | 15 | Visualization component smoke tests |
| `App.test.tsx` | 16 | Full app integration tests |

All domain math is verified against worked examples from the specification documents.

### Specifications

Detailed mathematical specifications live in `docs/`:

- [estimation-math-spec.md](docs/estimation-math-spec.md) — Core formulas, worked examples, calibration guidance
- [staffing-plan-spec.md](docs/staffing-plan-spec.md) — Staffing grid design, cost calculations
- [coordination-overhead-spec.md](docs/coordination-overhead-spec.md) — Brooks's Law model, gap analysis

### Persistence

- No backend or authentication required
- Session data saved to localStorage automatically
- Export/import as JSON with schema versioning for portability

### Deployment

Deployed to Azure Static Web Apps via GitHub Actions. The build uses pnpm (not Azure's default npm) with `skip_app_build: true` — the CI pre-builds with pnpm and deploys the `dist/` folder directly.
