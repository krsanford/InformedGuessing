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
5. **Team sizing curve**: Visualization showing optimal team size and the penalty for deviating

**The transformation:**

```
Base estimate:           937h  (productive work needed)
Staffing plan:           4 people × 15 weeks
         ↓
Coordination overhead:  +148h  (computed from team composition)
Adjusted estimate:     1,085h  (what this team actually needs)
         ↓
Staffed hours:         1,160h  (from staffing grid)
Remaining buffer:         75h  (for PTO, ramp-up, continuity)
```

### Why This Matters

Without this model, the staffing delta is opaque: "+223 hours (+24%)". Is that too much? Too little? You can't tell. With coordination overhead computed, the delta decomposes into:

- **Structural cost** (coordination overhead): Unavoidable given your team size. The only way to reduce it is fewer people.
- **Operational buffer** (remaining): Covers PTO, ramp-up, continuity, and unknowns. This is the part you can evaluate as "enough" or "too thin."

This gives stakeholders a concrete answer: "148 hours of our buffer is coordination overhead from having 4 people. The remaining 75 hours covers PTO and ramp-up. If we add a 5th person, coordination rises to 240 hours and we'd be 17 hours short."

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

**Default: α = 4 hours per pair per week.** This accounts for both direct communication and indirect coordination friction. It produces an optimal team size of ~9-10 people for typical projects, consistent with widely observed "two-pizza team" guidelines.

**Calibration:** Teams with strong async practices (fewer meetings, good documentation) may use α = 2-3. Teams with heavy ceremony, complex codebases, or cross-timezone coordination may need α = 5-6. Track actual coordination time to calibrate.

---

## Adjustable Constant

| Name | Default | Unit | Range | Purpose |
|------|---------|------|-------|---------|
| **coordination_cost_per_pair** | 4 | hours/pair/week | 0.5–8.0 | Coordination overhead per pair of active team members per week. Higher values model heavier coordination burden. |

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

**Example (Week 1 of worked staffing plan):**
```
Scrum Master:    6h  → active
Lead Dev:       36h  → active
Associate Dev:  36h  → active
QA:              8h  → active

active_people = 4
channels = 4 × 3 / 2 = 6
weekly_coordination = 4 × 6 = 24 hours
```

**Example (Week 7 — PI Planning):**
```
All cells are "PI Plan" (annotations)
active_people = 0
channels = 0
weekly_coordination = 0 hours
```

**Example (Week 8 — Lead Dev on PTO):**
```
Scrum Master:    6h  → active
Lead Dev:       PTO  → NOT active
Associate Dev:  36h  → active
QA:              8h  → active

active_people = 3
channels = 3 × 2 / 2 = 3
weekly_coordination = 4 × 3 = 12 hours
```

### Total Coordination Overhead

**Formula:**
```
total_coordination_hours = Σ weekly_coordination(w)    for all weeks
```

**Worked example (15 weeks, α = 4):**
```
Weeks 1-2:   4 people active → 6 channels × 4 = 24h/week × 2 = 48h
Weeks 3-6:   3 people active (QA=0) → 3 channels × 4 = 12h/week × 4 = 48h
Week 7:      0 people (PI Plan) → 0h
Weeks 8-9:   3 people (Lead on PTO) → 3 channels × 4 = 12h/week × 2 = 24h
Weeks 10-15: 4 people active → 6 channels × 4 = 24h/week × 6 = 144h

total_coordination_hours = 48 + 48 + 0 + 24 + 144 = 264 hours
```

### Adjusted Estimate

**Formula:**
```
adjusted_effort_hours = base_effort_hours + total_coordination_hours
```

Where `base_effort_hours` = `total_effort_hours` from the portfolio calculation (expected + 1σ buffer).

**Worked example:**
```
base_effort_hours = 937h (from estimation module)
total_coordination_hours = 264h
adjusted_effort_hours = 937 + 264 = 1,201h
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
total_coordination_hours = 264h
effective_productive_hours = 1,160 - 264 = 896h
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
Base effort:             937h  (the productive work)
Coordination overhead:  +264h  (structural cost of 3-4 person team)
Adjusted estimate:     1,201h  (what this team needs)
Staffed:               1,160h  (what the plan provides)
Remaining buffer:        -41h  (SHORT — under-resourced!)
```

**Interpretation:** With α=4 and a 3-4 person team over 15 weeks, the coordination overhead (264h) is substantial. The staffing plan doesn't provide enough total hours to cover both productive work AND coordination. The team would need to either:
- Extend the timeline (add weeks)
- Reduce team size (fewer communication channels)
- Reduce coordination overhead (better async practices → lower α)
- Accept the risk of overrun

Note: With α=2 (lighter coordination), the numbers shift:
```
Coordination overhead:  +156h
Adjusted estimate:     1,093h
Remaining buffer:        +67h  (buffered)
```

The sensitivity to α demonstrates why it should be calibrable.

---

## Team Sizing Curve Visualization

### Purpose

Show the fundamental trade-off of team size: too few people and work drags, too many and coordination consumes the gains. This is Brooks's Law made visual and interactive.

### The Model

For N people all working full-time (`billable_hours_per_week`):

```
effective_weekly_capacity(N) = N × h - α × N × (N - 1) / 2
duration(N) = base_effort_hours / effective_weekly_capacity(N)
```

Where:
- `h` = `billable_hours_per_week` (default 36)
- `α` = `coordination_cost_per_pair` (default 4)
- `base_effort_hours` = total effort from estimation (expected + buffer)

### Optimal Team Size

The minimum of the curve occurs at:

```
N_optimal = floor(h / α + 0.5)

(Evaluated at floor and ceil, pick whichever gives lower duration)
```

With defaults (h=36, α=4): `N_optimal = floor(9.5) = 9` or `ceil = 10`, evaluate both.

### Maximum Viable Team Size

The team size where coordination consumes ALL capacity:

```
N_max = floor(2h / α + 1)
```

Beyond this, effective capacity is zero or negative — the team literally cannot do any productive work.

With defaults: `N_max = floor(19) = 19`

### Curve Data Points

Evaluate `duration(N)` for N = 1, 2, 3, ..., min(N_max, 20):

**Worked example (base_effort = 937h, h = 36, α = 4):**

| N  | Channels | Coord/wk | Effective cap/wk | Duration (weeks) |
|----|----------|----------|-------------------|-------------------|
| 1  | 0        | 0h       | 36h               | 26.0              |
| 2  | 1        | 4h       | 68h               | 13.8              |
| 3  | 3        | 12h      | 96h               | 9.8               |
| 4  | 6        | 24h      | 120h              | 7.8               |
| 5  | 10       | 40h      | 140h              | 6.7               |
| 6  | 15       | 60h      | 156h              | 6.0               |
| 7  | 21       | 84h      | 168h              | 5.6               |
| 8  | 28       | 112h     | 176h              | 5.3               |
| 9  | 36       | 144h     | 180h              | 5.2               |
| 10 | 45       | 180h     | 180h              | **5.2** ← optimal |
| 11 | 55       | 220h     | 176h              | 5.3               |
| 12 | 66       | 264h     | 168h              | 5.6               |
| 15 | 105      | 420h     | 120h              | 7.8               |
| 18 | 153      | 612h     | 36h               | 26.0              |

The curve is symmetric: 1 person and 18 people take the same duration (26 weeks). The sweet spot is 9-10 people. Beyond 15, it degrades rapidly.

### Visualization Design

The Team Sizing Curve renders as a pure SVG chart in the InsightsPanel:

- **X-axis**: Team size (whole numbers, 1 to N_max or 20, whichever is less)
- **Y-axis**: Calendar duration (weeks)
- **Curve**: Connected points at each integer N, with filled area under the curve
- **Optimal zone**: Highlighted region around the minimum (±1 person)
- **Current team marker**: The user's average active team size from the staffing grid, plotted on the curve
- **Labels**: Optimal team size, current team size, duration at each

### Current Team Size (from staffing grid)

To plot the user's actual team on the curve:

```
avg_active_people = Σ active_people(w) / productive_week_count

Where productive_week_count = count of weeks where active_people(w) > 0
```

This gives the average number of active people across weeks where work is happening. Since the curve uses whole numbers but the average may be fractional, the marker is plotted at the fractional position with the actual duration from the staffing plan.

### Educational Content

The `<details>/<summary>` section for this chart explains:

**Why this matters:** Every person you add to the team creates new communication channels with everyone already there. There's a point where adding people actually makes the project take LONGER because coordination overhead exceeds the productive contribution.

**How to use this:** Find your current team on the curve. If you're to the right of optimal, each person you remove would speed things up AND reduce cost. If you're to the left, adding people helps — but with diminishing returns as you approach optimal.

**Take action:** If your team is significantly larger than optimal, consider whether all roles need to be active simultaneously. Phasing involvement (e.g., UX heavy early, QA heavy late) keeps the instantaneous team size lower while maintaining the same total capacity.

---

## The Part-Time Penalty

### Why Part-Timers Cost More Per Hour

A person working fewer hours than `billable_hours_per_week` creates the same number of communication channels but contributes less productive output. Their coordination-to-contribution ratio is worse.

**Example with α = 4:**

| Role | Hours/week | Channels (4-person team) | Coord cost share | Net productive | Coord ratio |
|------|-----------|--------------------------|-----------------|----------------|-------------|
| Lead Dev | 36h | 3 | 12h | 24h | 33% overhead |
| Assoc Dev | 36h | 3 | 12h | 24h | 33% overhead |
| QA | 20h | 3 | 12h | 8h | 60% overhead |
| Scrum Master | 6h | 3 | 12h | **-6h** | **200% overhead** |

The Scrum Master at 6h/week is a **net-negative contributor** in this model — their coordination cost (12h share) exceeds their productive output (6h). This doesn't mean they shouldn't be on the team (coordination IS their job), but it quantifies the structural cost of having them in the communication graph.

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
     │  • team sizing curve data        │
     │                                  │
     └──────────┬──────────────────────┘
                │
     ┌──────────┴──────────┐
     │                      │
  StaffingSection       InsightsPanel
  (gap decomposition)   (team sizing curve)
```

### Domain Layer (`src/domain/coordination.ts`)

New pure-function module, following the same patterns as `estimation.ts` and `staffing.ts`:

| Function | Signature | Purpose |
|----------|-----------|---------|
| `countActivePeople` | `(row_cells: string[], weekIndex: number) → boolean` | Whether a row is active in a given week |
| `getActivePeoplePerWeek` | `(rows: StaffingRow[], weekCount: number) → number[]` | Active people count per week |
| `calculateWeeklyCoordination` | `(activePeople: number, alpha: number) → number` | Coordination hours for one week |
| `calculateTotalCoordination` | `(activePeoplePerWeek: number[], alpha: number) → number` | Sum of coordination across all weeks |
| `calculateAdjustedEstimate` | `(baseEffort: number, totalCoordination: number) → number` | Base + coordination |
| `calculateEffectiveProductive` | `(staffedHours: number, totalCoordination: number) → number` | Staffed - coordination |
| `calculateGapDecomposition` | `(baseEffort, totalCoordination, staffedHours) → GapDecomposition` | Full breakdown |
| `computeTeamSizingCurve` | `(baseEffort, h, alpha) → TeamSizingCurveData` | U-curve data points |
| `calculateOptimalTeamSize` | `(h, alpha) → number` | Optimal N (whole number) |

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

interface TeamSizingCurveData {
  points: Array<{ n: number; duration: number }>
  optimal_n: number
  optimal_duration: number
  max_viable_n: number
  current_avg_n: number
  current_duration: number | null
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

2. **Team Sizing Curve**: New visualization component in `InsightsPanel`, placed in the `secondRow` alongside existing charts. Only renders when both estimation results AND staffing data exist (needs both to be meaningful).

3. **New Constant**: Added to `AdvancedVariables` panel as a fifth field.

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

// With α = 4:
// Total coordination = 48 + 48 + 0 + 24 + 144 = 264 hours
// Adjusted estimate = 937 + 264 = 1,201 hours
// Effective productive = 1,160 - 264 = 896 hours
// Remaining buffer = 1,160 - 1,201 = -41 hours (short)
```

**Test categories:**
1. Active people counting (numeric, annotation, empty, zero cells)
2. Channel calculation (0, 1, 2, many people)
3. Weekly coordination (single week, various team sizes)
4. Total coordination (multi-week with varying team sizes)
5. Adjusted estimate
6. Effective productive hours
7. Gap decomposition (buffered, tight, short scenarios)
8. Team sizing curve (correct shape, optimal N, max N)
9. Edge cases: empty grid, single person, single week, all annotations

---

## Worked Example Summary

Using the standard staffing plan from the staffing spec with α = 4:

```
BASE ESTIMATE
  Expected hours:          828h
  Portfolio range spread:  109h
  Total effort (84%):      937h
  Staff weeks:             26.0
  Duration:                11 weeks

STAFFING PLAN
  4 roles × 15 weeks
  Staffed hours:          1,160h
  Staffed cost:          $165,000

COORDINATION ANALYSIS
  Average active people:    3.6 (varies 0-4 per week)
  Total coordination:       264h
  Adjusted estimate:      1,201h
  Effective productive:     896h
  Remaining buffer:         -41h (SHORT)

TEAM SIZING CURVE
  Optimal team size:        9-10 people (for this effort level)
  Current avg team:         3.7 people
  Current position:         Left of optimal (understaffed for speed)
  Max viable team:          19 people

GAP DECOMPOSITION
  Base effort:              937h (80.8%)
  Coordination overhead:    264h (22.8%)
  Remaining buffer:         -41h (-3.5%)
  Status:                   Under-resourced by 41 hours
```

---

## References

- **Brooks, Frederick P. (1975).** *The Mythical Man-Month.* Addison-Wesley.
  - Chapter 2: "The Mythical Man-Month" — the original formulation of N(N-1)/2 communication channels

- **Putnam, Lawrence H. & Myers, Ware. (1992).** *Measures for Excellence.* Yourdon Press.
  - Empirical models relating team size, effort, and duration

- **Hackman, J. Richard. (2002).** *Leading Teams.* Harvard Business School Press.
  - Research on optimal team sizes and coordination costs in knowledge work
