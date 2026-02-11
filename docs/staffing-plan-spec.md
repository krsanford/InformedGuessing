# Staffing Plan Specification

## Foundation and Purpose

This specification defines a **staffing plan module** that bridges the gap between a mathematical estimate and a realistic delivery plan. The estimation model produces a "minimally committable number" — the statistical effort and duration needed. The staffing plan answers the next question: **what does it actually cost to staff a team that can deliver this?**

### Why Staffing Plans Differ From Estimates

The estimation module might say "892 hours over 11 weeks." But you can't simply divide 892 by 11 and hire that many people. Real delivery involves:

- **Project continuity**: You can't release a developer for 3 days mid-sprint because the math says their tasks are done. Teams need consistent allocation.
- **Non-linear engagement**: QA ramps up late. UX designers are heavy early. A scrum master is split across multiple workstreams.
- **Life happens**: PTO, holidays, company events, PI planning ceremonies, onboarding time.
- **Go-live support**: You can't reduce to 1 developer the week before launch. The right disciplines need availability for production and operational hypercare issues.
- **Ramp-up periods**: New team members aren't productive on day one. Weeks 1-2 may be mostly learning.
- **Discipline Omissions**: Additional hours and cost may be required by other disciplines that aren't directly contributing to velocity, or omissions of those skill activities during estimation.

**The staffing plan will always have more hours than the estimate.** This is expected and correct — it reflects the real cost of delivery vs. the theoretical minimum. The delta between the two is the "cost of reality."

### What This Module Does

**Input:** A week-by-week grid where each row is a discipline/role and each cell contains planned hours or an annotation (like "PTO" or "Holiday").

**Output:**
1. Total hours per role and per week
2. Total cost per role (hours × hourly rate)
3. Grand total cost, **rounded up** to the nearest $5,000
4. Comparison against the estimation output: staffed hours vs. estimated effort

**The transformation:**

```
Estimation output:  892 hours effort, 11 weeks duration
         ↓
Staffing plan:      4 roles × 15 weeks = grid of planned hours
         ↓
Reality check:      1,160 staffed hours (+30% over estimate)
                    $164,500 → rounds to $165,000
```

### Relationship to the Estimate

The estimation module's **duration** (in weeks) provides the starting point for the number of columns. But:
- The staffing plan will typically span **more weeks** than the estimate (the example: 15 weeks vs. 11 estimated)
- The staffing plan will have **more total hours** than the estimated effort (the example: 1,160h vs. 892h)
- This delta is not waste — it's the cost of continuity, availability, and real-world constraints

The staffing plan makes this visible so stakeholders understand why the actual cost exceeds the mathematical minimum.

---

## The Staffing Grid

### Structure

The grid is a table where:
- **Rows** = disciplines or roles (e.g., "Lead Dev", "QA", "Scrum Master")
- **Columns** = calendar weeks (numbered sequentially: W1, W2, ... WN)
- **Cells** = planned hours for that role in that week, OR a text annotation

Each row also has:
- A **discipline name** (free text)
- An **hourly rate** ($/hr) for cost calculation

The grid has summary calculations:
- **Row totals**: total hours and total cost per role
- **Column totals**: total hours per week across all roles
- **Grand totals**: total hours, raw total cost, and rounded total cost

### Cell Values

Each cell in the grid stores a **string value**. This is interpreted as follows:

| Cell Content | Interpretation | Hours Counted | Example |
|-------------|---------------|---------------|---------|
| Numeric string | Planned hours for that role/week | The numeric value | "36", "8", "6" |
| Empty string | No entry / unused | 0 | "" |
| Non-numeric string | **Annotation** — a label explaining why hours are zero or unusual | 0 | "PTO", "Holiday", "PI Plan", "Ramp Up" |
| Negative number | Invalid — treated as 0 | 0 | "-5" |

**Why text annotations?** Real staffing plans need to communicate *why* a cell is zero or unusual. "0" in a cell could mean "we forgot to fill this in" or "this person isn't needed this week." But "PTO" is unambiguous — the person is unavailable. Common annotations:

| Annotation | Meaning |
|-----------|---------|
| PTO | Planned time off — person is unavailable |
| Holiday | Company/public holiday — nobody works |
| PI Plan | PI Planning ceremony — no productive work |
| Ramp Up | Onboarding period — minimal productive output |
| Go Live | Production deployment — availability required but hours uncertain |

Users can type any text — these are suggestions, not a fixed set.

---

## Calculations

### Cell Parsing

**Formula:**
```
hours = parseCellHours(cellValue)
```

**Rules:**
1. Trim whitespace from the cell value
2. If empty after trimming → 0 hours
3. Attempt to parse as a number (float)
4. If the parse succeeds and the value is ≥ 0 → that number of hours
5. If the parse fails (NaN) or the value is negative → 0 hours

**Why this approach:** This mirrors how spreadsheets work — the user types whatever they want, and the system interprets it for calculations. Annotations like "PTO" naturally count as 0 hours without needing a separate data type.

### Annotation Detection

**Formula:**
```
isAnnotation = isCellAnnotation(cellValue)
```

**Rules:**
1. Trim whitespace
2. If empty → not an annotation (it's just blank)
3. If parseable as a number → not an annotation (it's hours)
4. Otherwise → it's an annotation

**Purpose:** Used by the UI to apply distinct visual styling to annotation cells (center-aligned, amber tint, uppercase) vs. numeric cells (right-aligned, monospace).

---

### Row Totals

**Formulas:**
```
row_total_hours = Σ parseCellHours(cell_i)    for all cells in the row
row_total_cost  = row_total_hours × hourly_rate
```

**Example:**
```
Lead Dev: rate = $175/hr
Cells: [36, 36, 36, 36, 36, 36, "PI Plan", "PTO", "PTO", 36, 36, 36, 36, 36, 36]

row_total_hours = 36 × 12 + 0 + 0 + 0 = 432 hours
row_total_cost  = 432 × $175 = $75,600
```

**Effect on planning:** Row totals show the total commitment per role. This helps identify which roles consume the most hours and cost, enabling trade-off discussions ("Can we use an Associate Dev instead of a Lead Dev for some of these weeks?").

---

### Week (Column) Totals

**Formula:**
```
week_total_hours[w] = Σ parseCellHours(row_i.cells[w])    for all rows
```

**Example (Week 1):**
```
Scrum Master: 6
Lead Dev: 36
Associate Dev: 36
QA: 8
─────────────
Week 1 total: 86 hours
```

**Effect on planning:** Column totals show the weekly burn rate in hours. This reveals the team's capacity profile over time — useful for identifying peaks, valleys, and weeks where the team is underutilized or overloaded.

---

### Grand Totals

**Formulas:**
```
grand_total_hours    = Σ row_total_hours_i         for all rows
grand_total_cost_raw = Σ row_total_cost_i          for all rows
grand_total_cost     = roundUp(grand_total_cost_raw, $5,000)
```

**Why grand totals matter:** These are the numbers that go into budgets and executive summaries. The total hours show the full scope of team commitment. The total cost is what finance needs to approve.

---

### Cost Rounding

**Formula:**
```
rounded_cost = ⌈raw_cost / 5000⌉ × 5000
```

Where ⌈⌉ denotes ceiling (round up to next integer).

**Examples:**
```
$174,200  →  $175,000
$175,000  →  $175,000  (exact multiple stays)
$175,001  →  $180,000
$1        →  $5,000
$0        →  $0
```

**Why round up?**

Precision creates false confidence. A budget of "$174,237.50" implies we know the cost to the penny. We don't — this is an estimate built on estimates. Rounding up to the nearest $5,000:
1. **Communicates that this is an estimate**, not a quote
2. **Provides a small implicit buffer** for the inevitable things we missed
3. **Simplifies communication** with stakeholders
4. **Always rounds up**, never down — we'd rather have a small surplus than a deficit

**Why $5,000?** This is appropriate for mid-size projects ($50K-$500K range). The rounding increment is small enough to be meaningful but large enough to clearly signal "this is a round number, not a precise calculation."

---

### Estimate Comparison

**Formulas:**
```
delta_hours   = staffed_hours - estimated_effort_hours
delta_percent = (delta_hours / estimated_effort_hours) × 100
```

**Example:**
```
Estimated effort:  892 hours (from portfolio calculation)
Staffed hours:     1,160 hours (from staffing grid)

delta_hours   = 1,160 - 892 = 268 hours
delta_percent = (268 / 892) × 100 = 30.0%
```

**What the delta means:**

The delta is the "cost of reality" — the difference between the mathematical minimum and what it actually takes to field a team. Typical deltas:

| Delta Range | Interpretation |
|-------------|---------------|
| 0-15% | Very lean staffing — may be too aggressive |
| 15-35% | Normal range for well-planned projects |
| 35-60% | Conservative staffing or significant real-world constraints |
| 60%+ | May indicate overstaffing or excessive buffer — worth reviewing |

**These ranges are guidelines, not rules.** A project with many holidays, extensive PTO, or heavy ceremony overhead will naturally have a larger delta. The point is visibility, not judgment.

**Edge case:** If the estimate is not yet computed (no valid work items), the comparison is not shown.

---

## Worked Example

Using the data from the "Worksheet Example" tab in the estimation workbook.

### Starting Point (from Estimation Module)

```
Estimated effort:  892 hours (expected + 1× range spread)
Estimated duration: 11 weeks
Billable hours/week: 36
```

### Staffing Grid

The staffing plan extends to **15 weeks** (4 more than the 11-week estimate) to account for a PI Planning ceremony, PTO, and ramp-up time.

| # | Discipline | $/hr | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | W9 | W10 | W11 | W12 | W13 | W14 | W15 | Hours | Cost |
|---|-----------|------|----|----|----|----|----|----|---------|--------|--------|-----|-----|-----|-----|-----|-----|-------|------|
| 1 | Scrum Master | $100 | 6 | 6 | 6 | 6 | 6 | 6 | PI Plan | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 84 | $8,400 |
| 2 | Lead Dev | $175 | 36 | 36 | 36 | 36 | 36 | 36 | PI Plan | PTO | PTO | 36 | 36 | 36 | 36 | 36 | 36 | 432 | $75,600 |
| 3 | Associate Dev | $125 | 36 | 36 | 36 | 36 | 36 | 36 | PI Plan | 36 | 36 | 36 | 36 | 36 | 36 | 36 | 36 | 504 | $63,000 |
| 4 | QA | $125 | 8 | 8 | 0 | 0 | 0 | 0 | PI Plan | 8 | 8 | 8 | 20 | 20 | 20 | 20 | 20 | 140 | $17,500 |
| | **Week Totals** | | 86 | 86 | 78 | 78 | 78 | 78 | 0 | 50 | 50 | 86 | 98 | 98 | 98 | 98 | 98 | | |

### Totals

```
Grand total hours:     1,160
Grand total cost raw:  $164,500
Grand total cost:      $165,000  (rounded up to nearest $5,000)
```

### Comparison to Estimate

```
Estimated effort:   892 hours
Staffed hours:      1,160 hours
Delta:              +268 hours (+30.0%)
```

### Narrative: Why 1,160 Hours Instead of 892?

Walking through the staffing decisions that created the 30% delta:

1. **Weeks 1-2 are ramp-up** (86h/week): The full team is allocated, but much of this time is onboarding, environment setup, and understanding requirements. Productive output is lower than the hours suggest.

2. **Week 7 is PI Planning** (0h): An entire week lost to ceremony. The estimate doesn't account for organizational overhead — the staffing plan does.

3. **Weeks 8-9: Lead Dev PTO** (50h/week): The project continues without the lead. The Associate Dev carries on, but the total capacity drops. The project can't pause for someone's vacation.

4. **QA engagement is non-linear**: QA starts light (8h/week for early test planning), drops to zero mid-project (devs are building), then ramps to 20h/week for testing and acceptance. You can't estimate QA as a linear proportion of dev hours.

5. **Scrum Master is low-engagement throughout**: 6h/week for standups, backlog grooming, retros. Not enough to justify a dedicated person, but required for team coordination.

6. **The project runs 15 weeks, not 11**: Even though the estimation model says 11 weeks of effort, the calendar time extends to 15 weeks once you account for the PI Planning gap, PTO, and the QA tail.

**Bottom line:** The estimate says "you need 892 hours of productive work." The staffing plan says "fielding a team that can deliver 892 hours of productive work will cost 1,160 hours and $165,000."

---

## Grid Management

### Initializing the Grid

When the estimation module has results, the staffing section offers to initialize the grid with the estimated duration (in weeks) as the starting column count. This is a convenience — the user can always adjust the week count manually.

**Initial state:** 0 weeks, 0 rows. The grid is empty until the user takes action.

**Initialization from estimate:** Sets the week count to `duration_weeks` from the portfolio results. Does not add rows — the user adds their own disciplines.

### Adding and Removing Weeks

Users can adjust the week count using +/- controls. When the week count changes:

- **Adding weeks**: Each row gets new empty cells appended to the end
- **Removing weeks**: Each row is truncated from the end. **Data in removed weeks is lost** — this is intentional simplicity, but the UI should make it clear.

### Adding and Removing Rows

- **Adding a row**: Creates a new row with empty discipline, $0 rate, and empty cells matching the current week count
- **Removing a row**: Removes the row entirely. No confirmation dialog needed for single-row delete (matching the WorkItem pattern).

### Row Fields

| Field | Type | Validation | Default |
|-------|------|-----------|---------|
| discipline | string | Any text, no validation | "" (empty) |
| hourly_rate | number | Must be ≥ 0 | 0 |
| cells | string[] | Each cell: any string | All empty strings |

**Why no discipline validation?** Users may have non-standard role names ("Platform Engineer", "DevSecOps", "Accessibility Specialist"). Free text is more flexible than a preset dropdown.

**Why allow $0 rate?** Some roles may be internal/salaried with no direct billing, or the user may not know rates yet. $0 rate simply means that role doesn't contribute to the cost total.

---

## Display and Formatting

### Numeric Values

- **Hours in cells**: Display as entered (no decimal formatting for whole numbers)
- **Hourly rate**: Display with $ prefix, no decimals for whole numbers
- **Row total hours**: Integer or 1 decimal place if fractional
- **Row total cost**: Dollar format with comma separators ($75,600)
- **Grand total hours**: Integer or 1 decimal place
- **Grand total cost (rounded)**: Dollar format with comma separators, prominently displayed ($165,000)
- **Grand total cost (raw)**: Shown as secondary/smaller text for transparency

All numeric displays use **monospace/tabular-nums** font for alignment.

### Annotation Cells

Annotation cells (non-numeric, non-empty text) are displayed differently from numeric cells:
- **Center-aligned** (vs. right-aligned for numbers)
- **Uppercase, smaller font, semi-bold** for visual distinction
- **Warm amber tint background** (subtle, ~6% opacity) to signal "this is not a number"

### Comparison Banner

When both estimate results and staffing data exist, display a comparison:

```
Estimated Effort: 892h  |  Staffed Hours: 1,160h  |  Buffer: +268h (+30%)
```

The buffer percentage uses amber color (matching the "hot" accent) when positive — because exceeding the estimate is expected and normal, not a warning.

---

## Validation Rules

### Row-Level Validation

1. `hourly_rate >= 0` — Negative rates are nonsensical
2. No validation on discipline name (free text)
3. No validation on individual cells (any string is valid)

### Grid-Level Validation

1. `week_count >= 0` — Can't have negative weeks
2. No minimum row count — an empty grid is valid (just shows nothing)
3. All rows must have exactly `week_count` cells (enforced by resize logic)

### Edge Cases

**Empty grid (0 rows, 0 weeks):**
- All totals = 0
- No comparison shown
- UI shows empty state / initialization prompt

**Rows with no hours (all cells empty or annotations):**
- Row total = 0 hours, $0 cost
- Row still contributes to the grid visually
- Valid — represents a role that's "on call" or "available but not actively working"

**All-annotation week (e.g., "Holiday" for everyone):**
- Week total = 0
- This is correct and expected

**Very large grids (20+ rows, 40+ weeks = 800+ cells):**
- Performance concern: Each cell is an input element
- Mitigation: React.memo on row components, only re-render changed rows

---

## Implementation Architecture

### Domain Layer (`src/domain/staffing.ts`)

Pure functions, no React dependency. Follows the same pattern as `estimation.ts`:

| Function | Signature | Purpose |
|----------|-----------|---------|
| `parseCellHours` | `(cell: string) → number` | Parse cell string to hours |
| `isCellAnnotation` | `(cell: string) → boolean` | Detect annotation cells for styling |
| `validateStaffingRow` | `(row: StaffingRow) → string \| null` | Validate row, return error or null |
| `calculateRowTotals` | `(row: StaffingRow) → StaffingRowComputed` | Hours and cost per row |
| `calculateWeekTotals` | `(rows: StaffingRow[], weekCount: number) → number[]` | Hours per week column |
| `roundUpToCost` | `(raw: number, increment?: number) → number` | Round up to nearest $5,000 |
| `calculateStaffingGrid` | `(rows: StaffingRow[], weekCount: number) → StaffingGridComputed` | All grid calculations |
| `calculateStaffingComparison` | `(estimated: number, staffed: number) → StaffingComparison` | Estimate vs. staffed delta |
| `createStaffingRow` | `(id: number, weekCount: number) → StaffingRow` | New row with empty cells |
| `resizeRowCells` | `(rows: StaffingRow[], newWeekCount: number) → StaffingRow[]` | Pad/truncate cells |

### State Management

Extend the existing `useReducer` pattern:

**New state:**
```
AppState.staffing: {
  rows: StaffingRow[]
  week_count: number
  nextRowId: number
}
```

**New actions:**
- `STAFFING_ADD_ROW` — append new empty row
- `STAFFING_REMOVE_ROW` — remove by row ID
- `STAFFING_UPDATE_ROW` — update discipline or hourly_rate
- `STAFFING_UPDATE_CELL` — update single cell by row ID + week index
- `STAFFING_SET_WEEK_COUNT` — resize all rows
- `STAFFING_INIT_FROM_ESTIMATE` — set week count from estimate duration

### Component Hierarchy

```
App.tsx
  └─ StaffingSection          (toolbar + comparison + grid container)
       ├─ Comparison banner    (estimate vs. staffed)
       └─ StaffingGrid         (scrollable table)
            ├─ Header row      (week numbers)
            ├─ StaffingRow[]   (one per discipline)
            │    └─ StaffingCell[]  (one per week)
            └─ Summary row     (week totals + grand totals)
```

**Placement:** The StaffingSection renders in the main content area, below the InsightsPanel, as a scrolling section (not a separate tab/page).

### CSS Grid Layout

The grid uses CSS Grid with dynamic column count (set via inline style since week count is variable):

```
grid-template-columns: 40px 160px 80px repeat(N, 56px) 72px 88px 36px
                       #    name   rate  ...weeks...    hours cost  trash
```

The # and discipline columns are `position: sticky` for horizontal scrolling.

---

## Testing Requirements

### Domain Tests (`src/domain/staffing.test.ts`)

Using the worked example data:

```typescript
const testRows: StaffingRow[] = [
  { id: 1, discipline: 'Scrum Master', hourly_rate: 100,
    cells: ['6','6','6','6','6','6','PI Plan','6','6','6','6','6','6','6','6'] },
  { id: 2, discipline: 'Lead Dev', hourly_rate: 175,
    cells: ['36','36','36','36','36','36','PI Plan','PTO','PTO','36','36','36','36','36','36'] },
  { id: 3, discipline: 'Associate Dev', hourly_rate: 125,
    cells: ['36','36','36','36','36','36','PI Plan','36','36','36','36','36','36','36','36'] },
  { id: 4, discipline: 'QA', hourly_rate: 125,
    cells: ['8','8','0','0','0','0','PI Plan','8','8','8','20','20','20','20','20'] },
]

// Expected results:
// Scrum Master: 84h, $8,400
// Lead Dev: 432h, $75,600
// Associate Dev: 504h, $63,000
// QA: 140h, $17,500
// Grand total hours: 1,160
// Grand total cost raw: $164,500
// Grand total cost rounded: $165,000
// Week 1 total: 86h
// Week 7 total: 0h (PI Plan for all)
```

**Test categories:**
1. Cell parsing (numeric, empty, annotation, negative, decimal, whitespace)
2. Annotation detection
3. Row validation
4. Row total calculations (pure numeric, mixed with annotations)
5. Week total calculations
6. Cost rounding (boundary cases: $0, exact multiples, $1 over)
7. Full grid calculation with worked example data
8. Estimate comparison (delta hours and percent, zero-estimate edge case)
9. Row management (create, resize up, resize down)

### UI Integration Tests

Added to existing test file:
1. Staffing section visibility (appears when estimate exists)
2. Initialize from estimate
3. Add/remove rows
4. Edit discipline, rate, cells
5. Annotation styling applied
6. Computed totals displayed correctly
7. Comparison banner values
8. Week count adjustment (+/-)

---

## Future Considerations (Out of Scope)

These are noted for potential future work but are **not part of this specification**:

- **Named weeks / date mapping**: Mapping week numbers to actual calendar dates
- **Templates**: Pre-built role sets (e.g., "Standard Scrum Team" = SM + 2 Dev + QA)
- **Import from estimate**: Auto-suggesting roles based on work item categories
- **Utilization visualization**: Chart showing team utilization % over time
- **Export**: CSV/Excel export of the staffing grid
- **Multiple staffing scenarios**: Side-by-side comparison of different staffing approaches
