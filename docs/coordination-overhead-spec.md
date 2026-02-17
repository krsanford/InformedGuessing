# Coordination Overhead Specification

## Foundation and Purpose

This specification defines a **coordination overhead model** that bridges the estimation module and the staffing plan. The estimation module produces a base effort — the productive hours needed to complete the work. The staffing plan defines **who** will do that work. This module answers: **given the team you've assembled, how much additional effort does coordination consume, and is your staffing plan sufficient?**

### The Problem

The estimation module's duration formula (cube-root scaling) provides an initial duration estimate, but it can't know your actual team composition. It doesn't know whether you'll have 3 people or 8, whether some are part-time, or how the team changes week to week.

Once you build a staffing plan, you **do** know all of this. And team composition has a direct, quantifiable impact on project effort:

- **Brooks's Law**: Adding people to a project increases communication overhead. N people require N(N-1)/2 communication channels. Each channel consumes real time — standups, code reviews, syncs, context sharing.
- **The coordination tax is quadratic**: The 4th person adds 3 new channels, the 8th adds 7 new channels. Each additional person is more expensive than the last.
- **Part-time people pay full coordination cost**: A person working 6 hours/week creates the same number of communication channels as someone working 36 hours/week, but contributes far less productive output. Their coordination-to-contribution ratio is much worse.

### What This Module Does

**Input:** The staffing plan grid (who works when and how many hours) plus the base estimate.

**Output:**
1. **Coordination overhead**: Total hours consumed by team coordination, computed from actual team composition
2. **Adjusted estimate**: Base effort + coordination overhead — what the project actually needs given this team
3. **Effective productive hours**: Staffed hours minus coordination overhead — actual capacity for productive work
4. **Gap decomposition**: Breaks the staffing delta into coordination tax vs. remaining buffer

**The transformation:**

```
Base estimate:          1,066h  (productive work needed)
Staffing plan:           4 people × 15 weeks
         ↓
Coordination overhead:   +24h  (incremental, beyond what's baked into duration)
Adjusted estimate:     1,090h  (what this team actually needs)
         ↓
Staffed hours:         1,160h  (from staffing grid)
Remaining buffer:         70h  (for PTO, ramp-up, continuity)
```

### Why This Matters

Without this model, the staffing delta is opaque: "+94 hours (+9%)". Is that too much? Too little? You can't tell. With coordination overhead computed, the delta decomposes into:

- **Structural cost** (coordination overhead): Unavoidable given your team size. The only way to reduce it is fewer people or better async practices.
- **Operational buffer** (remaining): Covers PTO, ramp-up, continuity, and unknowns. This is the part you can evaluate as "enough" or "too thin."

This gives stakeholders a concrete answer: "24 hours of our buffer is incremental coordination overhead. The remaining 70 hours covers PTO and ramp-up."

---

## The Coordination Model

### Core Principle: People, Not FTEs

Brooks's Law operates on **people**, not full-time equivalents. A person working 6 hours/week creates the same communication channels as a person working 36 hours/week. Communication overhead is a function of **how many humans need to coordinate**, not how many hours they bill.

Therefore: **team size = count of people (rows) with productive hours in a given week.**

A person is "active" in a week if their cell contains a positive numeric value. Annotation cells ("PTO", "Holiday") and zero/empty cells mean the person is not active that week and does not contribute to communication channels.

### Communication Channels

For N active people in a given week:

```
channels = N × (N - 1) / 2
```

| People | Channels | New channels from adding this person |
|--------|----------|--------------------------------------|
| 1      | 0        | —                                    |
| 2      | 1        | +1                                   |
| 3      | 3        | +2                                   |
| 4      | 6        | +3                                   |
| 5      | 10       | +4                                   |
| 6      | 15       | +5                                   |
| 8      | 28       | +7                                   |
| 10     | 45       | +9                                   |
| 12     | 66       | +11                                  |

Each channel represents a pair of people who must maintain shared context: participate in the same standups, review each other's work, answer ad-hoc questions, and stay aligned on decisions.

### Coordination Cost Per Week

```
coordination_hours(w) = α × channels(w)
                      = α × N(w) × (N(w) - 1) / 2
```

Where α (`coordination_cost_per_pair`) is hours of overhead per pair of people per week.

### What α Captures

The coordination cost per pair per week includes:
- **Standup synchronization**: Understanding each other's updates (~10 min/day = 50 min/week)
- **Code review overhead**: Reviewing, discussing, iterating (~30 min/week)
- **Ad-hoc questions and interruptions**: Context sharing (~15 min/week)
- **Meeting overhead**: Planning, retros, design discussions (~20 min/week)
- **Context switching**: Mental cost of multi-person coordination (~15 min/week)
- **Implicit coordination**: Waiting, negotiating shared resources, resolving conflicts

**Default: α = 1 hour per pair per week.** This represents a lightweight baseline — enough to account for standup synchronization and ad-hoc questions, without assuming heavy ceremony. Most small teams (3-5 people) can coordinate effectively with minimal overhead.

**Calibration:** Teams with strong async practices (fewer meetings, good documentation) may keep α = 0.5-1. Teams with heavier ceremony, complex codebases, or cross-timezone coordination should increase to α = 2-4. Very heavy-process organizations may need α = 5-8. Track actual coordination time to calibrate.

---

## Adjustable Constant

| Name | Default | Unit | Range | Purpose |
|------|---------|------|-------|---------|
| **coordination_cost_per_pair** | 1 | hours/pair/week | 0.5–8.0 | Coordination overhead per pair of active team members per week. Higher values model heavier coordination burden. |

This constant is added to the existing Advanced Variables panel alongside the four estimation constants.

---

## Calculations

### Active People Per Week

**Formula:**
```
active_people(w) = count of rows where cell[w] is numeric and > 0
```

**Rules:**
1. Parse the cell value using existing `parseCellHours()`
2. If the result is > 0, the person is active in that week
3. Annotations ("PTO", "Holiday") → person is NOT active (0 hours parsed)
4. Empty cells → person is NOT active
5. Zero ("0") → person is NOT active

**Why this definition:** A person on PTO doesn't attend standup, doesn't need context updates, and doesn't create communication channels. They're temporarily absent from the coordination graph. Similarly, a QA person with 0 hours in week 3 (no testing work yet) doesn't need to coordinate with devs that week.

### Weekly Coordination Overhead

**Formula:**
```
weekly_coordination(w) = α × active_people(w) × (active_people(w) - 1) / 2
```

**Example (Week 1 of worked staffing plan, α = 1):**
```
Scrum Master:    6h  → active
Lead Dev:       36h  → active
Associate Dev:  36h  → active
QA:              8h  → active

active_people = 4
channels = 4 × 3 / 2 = 6
weekly_coordination = 1 × 6 = 6 hours
```

**Example (Week 7 — PI Planning):**
```
All cells are "PI Plan" (annotations)
active_people = 0
channels = 0
weekly_coordination = 0 hours
```

**Example (Week 8 — Lead Dev on PTO, α = 1):**
```
Scrum Master:    6h  → active
Lead Dev:       PTO  → NOT active
Associate Dev:  36h  → active
QA:              8h  → active

active_people = 3
channels = 3 × 2 / 2 = 3
weekly_coordination = 1 × 3 = 3 hours
```

### Total Coordination Overhead

**Formula:**
```
total_coordination_hours = Σ weekly_coordination(w)    for all weeks
```

**Worked example (15 weeks, α = 1):**
```
Weeks 1-2:   4 people active → 6 channels × 1 = 6h/week × 2 = 12h
Weeks 3-6:   3 people active (QA=0) → 3 channels × 1 = 3h/week × 4 = 12h
Week 7:      0 people (PI Plan) → 0h
Weeks 8-9:   3 people (Lead on PTO) → 3 channels × 1 = 3h/week × 2 = 6h
Weeks 10-15: 4 people active → 6 channels × 1 = 6h/week × 6 = 36h

total_coordination_hours = 12 + 12 + 0 + 6 + 36 = 66 hours (raw)
```

#### Incremental Coordination

The cube-root duration formula already bakes in coordination overhead for the "implied" team size (⌈staff_weeks / duration_weeks⌉). To avoid double-counting, the coordination module only charges the **incremental** overhead beyond what's already assumed.

```
implied_team_size = ⌈29.62 / 10⌉ = 3 people
baked_in_coordination = α × 3 × 2 / 2 = 1 × 3 = 3h/week

Incremental overhead per week:
  4 people active: raw=6h - baked=3h = 3h incremental
  3 people active: raw=3h - baked=3h = 0h incremental
  0 people active: 0h

Weeks 1-2:   incremental 3h/week × 2 = 6h
Weeks 3-6:   incremental 0h/week × 4 = 0h
Week 7:      0h
Weeks 8-9:   incremental 0h/week × 2 = 0h
Weeks 10-15: incremental 3h/week × 6 = 18h

total_incremental_coordination = 6 + 0 + 0 + 0 + 18 = 24 hours
```

### Adjusted Estimate

**Formula:**
```
adjusted_effort_hours = base_effort_hours + total_coordination_hours
```

Where `base_effort_hours` = `total_effort_hours` from the portfolio calculation (expected + 1σ buffer).

**Worked example:**
```
base_effort_hours = 1,066h (from estimation module)
total_coordination_hours = 24h (incremental)
adjusted_effort_hours = 1,066 + 24 = 1,090h
```

### Effective Productive Hours

**Formula:**
```
effective_productive_hours = staffed_hours - total_coordination_hours
```

Where `staffed_hours` = `grand_total_hours` from the staffing grid.

**Worked example:**
```
staffed_hours = 1,160h
total_coordination_hours = 24h
effective_productive_hours = 1,160 - 24 = 1,136h
```

### Gap Decomposition

**Formulas:**
```
coordination_gap = total_coordination_hours
remaining_buffer = staffed_hours - adjusted_effort_hours
                 = staffed_hours - (base_effort_hours + total_coordination_hours)

buffer_status:
  if remaining_buffer > 0:  "buffered" (comfortable)
  if remaining_buffer ≈ 0:  "tight" (minimal margin)
  if remaining_buffer < 0:  "short" (under-resourced)
```

**Worked example:**
```
Base effort:            1,066h  (the productive work)
Coordination overhead:    +24h  (incremental cost of team exceeding implied size)
Adjusted estimate:     1,090h  (what this team needs)
Staffed:               1,160h  (what the plan provides)
Remaining buffer:         +70h  (BUFFERED — comfortable margin)
```

**Interpretation:** With α=1 and a 3-4 person team over 15 weeks, the incremental coordination overhead (24h) is modest — the team only exceeds the implied team size of 3 during 8 weeks. The staffing plan provides a comfortable 70-hour buffer for PTO, ramp-up, and unknowns.

Note: With α=4 (heavier coordination), the numbers shift significantly:
```
Raw coordination:       264h
Baked-in (3 people):    -3h/week × 15 = -45h
Incremental:            219h
Adjusted estimate:     1,285h
Remaining buffer:       -125h  (SHORT — under-resourced!)
```

The sensitivity to α demonstrates why it should be calibrable.

---

## The Part-Time Penalty

### Why Part-Timers Cost More Per Hour

A person working fewer hours than `billable_hours_per_week` creates the same number of communication channels but contributes less productive output. Their coordination-to-contribution ratio is worse.

**Example with α = 1:**

| Role | Hours/week | Channels (4-person team) | Coord cost share | Net productive | Coord ratio |
|------|-----------|--------------------------|-----------------|----------------|-------------|
| Lead Dev | 36h | 3 | 3h | 33h | 8% overhead |
| Assoc Dev | 36h | 3 | 3h | 33h | 8% overhead |
| QA | 20h | 3 | 3h | 17h | 15% overhead |
| Scrum Master | 6h | 3 | 3h | **3h** | **50% overhead** |

With α=1, even the Scrum Master at 6h/week remains a net-positive contributor, but their coordination-to-contribution ratio (50%) is much worse than full-time roles (8%). At higher α values (e.g., α=4), part-time roles can become net-negative contributors where coordination cost exceeds productive output.

This insight is surfaced in the gap decomposition and helps stakeholders understand why small part-time allocations can be expensive relative to their contribution.

---

## Integration with Existing Architecture

### Data Flow

```
Estimation Module                    Staffing Plan
     │                                    │
     │ base_effort_hours                  │ staffing grid (rows × weeks)
     │                                    │
     └──────────┬─────────────────────────┘
                │
    Coordination Overhead Module
                │
     ┌──────────┴──────────────────────┐
     │                                  │
     │  • active_people per week        │
     │  • channels per week             │
     │  • coordination hours per week   │
     │  • total coordination overhead   │
     │  • adjusted estimate             │
     │  • effective productive hours    │
     │  • gap decomposition             │
     │                                  │
     └──────────┬──────────────────────┘
                │
  StaffingSection
  (gap decomposition)
```

### Domain Layer (`src/domain/coordination.ts`)

New pure-function module, following the same patterns as `estimation.ts` and `staffing.ts`:

| Function | Signature | Purpose |
|----------|-----------|---------|
| `getActivePeoplePerWeek` | `(rows: StaffingRow[], weekCount: number) → number[]` | Active people count per week |
| `calculateWeeklyCoordination` | `(activePeople: number, alpha: number) → number` | Coordination hours for one week |
| `calculateCoordination` | `(rows, weekCount, alpha, impliedTeamSize) → CoordinationResult` | Full coordination analysis with incremental overhead |
| `calculateGapDecomposition` | `(baseEffort, totalCoordination, staffedHours) → GapDecomposition` | Full breakdown |

### Types

```typescript
interface CoordinationResult {
  active_people_per_week: number[]
  coordination_hours_per_week: number[]
  total_coordination_hours: number
  average_active_people: number
}

interface GapDecomposition {
  base_effort_hours: number
  coordination_overhead_hours: number
  adjusted_effort_hours: number
  staffed_hours: number
  effective_productive_hours: number
  remaining_buffer_hours: number
  buffer_status: 'buffered' | 'tight' | 'short'
}
```

### State Management

The new constant `coordination_cost_per_pair` is added to `EstimationConstants`:

```typescript
interface EstimationConstants {
  expected_case_position: number
  range_spread_divisor: number
  billable_hours_per_week: number
  duration_scaling_power: number
  coordination_cost_per_pair: number    // NEW
}
```

No new reducer actions needed — the coordination calculations are derived (computed on render) from existing state, just like portfolio results and staffing comparison.

### UI Placement

1. **Gap Decomposition**: Replaces or extends the existing comparison banner in `StaffingSection`. Instead of just "Buffer: +268h (+30%)", shows the full decomposition.

2. **New Constant**: Added to `AdvancedVariables` panel as a fifth field.

---

## Testing Requirements

### Domain Tests (`src/domain/coordination.test.ts`)

Using the worked staffing example data:

```typescript
// Active people per week
// Weeks 1-2: 4 (SM, Lead, Assoc, QA)
// Weeks 3-6: 3 (SM, Lead, Assoc — QA=0)
// Week 7: 0 (all PI Plan)
// Weeks 8-9: 3 (Lead on PTO)
// Weeks 10-15: 4

// With α = 1, impliedTeamSize = 3:
// Incremental coordination = 6 + 0 + 0 + 0 + 18 = 24 hours
// Adjusted estimate = 1,066 + 24 = 1,090 hours
// Effective productive = 1,160 - 24 = 1,136 hours
// Remaining buffer = 1,160 - 1,090 = 70 hours (buffered)
```

**Test categories:**
1. Active people counting (numeric, annotation, empty, zero cells)
2. Channel calculation (0, 1, 2, many people)
3. Weekly coordination (single week, various team sizes)
4. Total coordination with incremental model (multi-week with varying team sizes)
5. Adjusted estimate
6. Effective productive hours
7. Gap decomposition (buffered, tight, short scenarios)
8. Edge cases: empty grid, single person, single week, all annotations

---

## Worked Example Summary

Using the standard staffing plan from the staffing spec with α = 1 (default):

```
BASE ESTIMATE
  Expected hours:          958h
  Portfolio range spread:  109h
  Total effort (84%):    1,066h
  Staff weeks:             29.6
  Duration:                10 weeks
  Implied team:            3 people

STAFFING PLAN
  4 roles × 15 weeks
  Staffed hours:          1,160h
  Staffed cost:          $164,500

COORDINATION ANALYSIS (incremental beyond implied team of 3)
  Average active people:    3.6 (varies 0-4 per week)
  Incremental coordination: 24h
  Adjusted estimate:      1,090h
  Effective productive:   1,136h
  Remaining buffer:          70h (BUFFERED)

GAP DECOMPOSITION
  Base effort:            1,066h
  Coordination overhead:     24h
  Remaining buffer:          70h
  Status:                    Comfortable margin for PTO and ramp-up
```

---

## References

- **Brooks, Frederick P. (1975).** *The Mythical Man-Month.* Addison-Wesley.
  - Chapter 2: "The Mythical Man-Month" — the original formulation of N(N-1)/2 communication channels

- **Putnam, Lawrence H. & Myers, Ware. (1992).** *Measures for Excellence.* Yourdon Press.
  - Empirical models relating team size, effort, and duration

- **Hackman, J. Richard. (2002).** *Leading Teams.* Harvard Business School Press.
  - Research on optimal team sizes and coordination costs in knowledge work
