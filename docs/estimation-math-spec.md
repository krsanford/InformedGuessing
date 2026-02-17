# Estimation Math Specification

## Foundation and Theory

This specification implements a **two-point estimation model** inspired by Steve McConnell's *Software Estimation: Demystifying the Black Art*. The core idea is that single-point estimates ("this will take 10 weeks") hide uncertainty. Two-point estimation (Best Case / Worst Case) makes uncertainty explicit.

### Why Two-Point Estimation?

**The problem with single-point estimates:**
- "This feature will take 80 hours" implies false precision
- Hides whether you're confident (70-90 hours) or uncertain (40-200 hours)
- Provides no way to calculate portfolio-level risk
- Forces stakeholders to guess at your confidence level

**Two-point estimation provides:**
- Explicit range bounds that communicate confidence
- Statistical foundation for aggregating multiple estimates
- Ability to calculate buffer sizes and confidence levels
- Data to track estimation accuracy over time

**Practical benefit:** When a manager asks "how long will this take?", you can say "We expect 958 hours with ±109 hours range spread, so we should plan for 1,066 hours to have 84% confidence of delivery." This is actionable information for resource planning.

**Key principle**: Estimation risk doesn't disappear when you ignore it. By quantifying it, you can manage it.

### What This Model Does

**Input:** For each work item, you provide two numbers:
- Best case hours (optimistic but plausible)
- Worst case hours (pessimistic but plausible)

**Output:** The model calculates:
1. **Expected effort** for each item and the total portfolio (the most likely outcome)
2. **Range spread** for each item and the portfolio—quantifies estimation risk in hours (scaled from the best/worst range)
3. **Planning effort** (expected + range spread buffer)—the number you actually staff to
4. **Estimated duration** in calendar weeks

**The transformation:**

Instead of guessing a single number ("this feature will take 80 hours"), you provide a range (60-120 hours). The model:
- Converts your range into an expected value and range spread measure
- **Combines work items statistically**: Expected values add linearly, but range spreads combine as square root of (sum of variances). Example: 10 items with ±10 hours range spread each = portfolio range spread of ±31.6 hours, not ±100 hours. Large portfolios are more predictable because variations cancel out.
- Adds a range spread buffer so you're not planning to the 50th percentile
- Estimates realistic calendar duration accounting for coordination overhead

**Example flow:**
```
Input:     10 work items, each with best/worst case hours
  ↓
Calculate: Expected = 958 hours (most likely total)
           Range spread = ±109 hours (our "margin of error")
  ↓
Add buffer: Planning effort = 1,066 hours (expected + 1× range spread = 84% confidence)
  ↓
Convert:    1,066 hours ÷ 36 hours/week = 29.6 staff-weeks
  ↓
Scale:      Duration = 10 calendar weeks (accounts for coordination)
```

**What range spread means in practice:**

If range spread is ±109 hours on an expected 958 hours:
- 958 hours (expected) = 50% confidence target
- 1,066 hours (expected + 1× range spread) ≈ 84% confidence
- 1,175 hours (expected + 2× range spread) ≈ 97% confidence

These percentages assume outcomes follow a bell curve and your best/worst estimates are calibrated correctly. The model's value is making estimation risk explicit and providing a systematic buffering approach.

The range spread lets you choose your confidence level: staff conservatively for high confidence, or optimistically if you can tolerate risk.

**Key insight:** The model makes estimation risk visible and builds it into planning, rather than pretending estimates are precise.

---

## Adjustable Constants

These constants encode empirical parameters that vary by organization, team maturity, and project characteristics. They have proven defaults but should be calibrated based on your team's historical data.

| Name | Default | Unit | Purpose and Rationale |
|------|---------|------|----------------------|
| **expected_case_position** | 0.6 | ratio (0-1) | Position of expected value between best and worst case. 0.6 means 60% of the way from best to worst — slightly pessimistic, reflecting that most tasks have more ways to go wrong than right. Adjust based on your team's actual outcomes. Typical range: 0.3-0.7. |
| **range_spread_divisor** | 2.6 | dimensionless | Scales the estimate range (worst - best) to a usable measure. Smaller values (1.5-2.0) = wider spread. Larger values (3.0-4.0) = narrower spread. Calibrate to match actual outcome distributions. |
| **billable_hours_per_week** | 36 | hours/week | Productive hours per staff member per week. Accounts for meetings, overhead, interruptions. Typical range: 30-40. Measure your actual productive time. |
| **duration_scaling_power** | 3.2 | dimensionless | Controls how effort scales to calendar duration. Reflects coordination overhead and task dependencies. Higher values = longer durations for same effort. Typical range: 3.0-5.0. |

---

## Input Variables (Per Work Item)

Each work item requires two estimates that bound the range of possible effort:

| Name | Unit | Description and Mental Model |
|------|------|------------------------------|
| **best_case_hours** | hours | **Optimistic but plausible estimate**. "If things go well, a single person of adequate and reasonable skill in the domain could complete this in X hours." Not the absolute minimum, but the lower bound of reasonable outcomes. |
| **worst_case_hours** | hours | **Pessimistic but plausible estimate**. "If we encounter typical problems—some requirements clarification, a few technical obstacles, normal rework—a single person of adequate and reasonable skill in the domain could complete this in Y hours." Not the worst imaginable disaster, but the upper bound of reasonable outcomes. |

These values are entered as whole hours. 1 hour increments are the lowest precision allowed.

### Calibrating Your Estimates

**Mental model for the range:**

When giving best/worst estimates, you should feel roughly **90% confident** that a single person of adequate skill could complete the work within this range. This means:
- 5% chance it finishes faster than your best case (you got lucky)
- 5% chance it takes longer than your worst case (unusual problems)
- 90% of the time, actual effort falls between best and worst

**Wide ranges are valid and useful:**

A range of 4-400 hours is perfectly valid if that reflects true estimation risk. Wide ranges indicate:
- **Unknowns**: Requirements not fully understood, technical approach unclear
- **Dependencies**: Waiting on other teams, external factors
- **Complexity**: Many moving parts, integration challenges

**Wide ranges force decision-making:**
- **Accept the risk**: Move forward knowing the estimation risk, buffer accordingly
- **Investigate further**: Spike, prototype, or research to narrow the range
- **Cut scope**: Decide the item isn't worth the estimation risk and remove it

Estimation can become "boil the ocean"—at some point you must accept that estimation risk exists. The range makes it visible so you can manage it.

**Key assumptions:**
- Estimates are for **one person** working on the item (not a team)
- That person has **adequate and reasonable skill** in the domain (not an expert, not a novice)
- Work is done with **typical interruptions** and normal working conditions

### Why These Bounds?

**Best case** shouldn't be "everything is perfect"—that's unrealistic. It should represent a plausible optimistic scenario.

**Worst case** shouldn't be "the building burns down"—that's not useful for planning. It should represent a plausible pessimistic scenario with typical problems.

The difference between these bounds quantifies your **estimation risk**. Small ranges indicate well-understood work. Large ranges indicate high estimation risk.

**Important**: How people mentally calibrate "best" and "worst" varies. The constants in this model (especially `range_spread_divisor`) are tuned to typical interpretations but should be calibrated to your team's actual performance.

---

## Individual Work Item Calculations

### Expected Effort

**Formula:**
```
expected_hours = best_case_hours + expected_case_position × (worst_case_hours - best_case_hours)
```

**Why this formula:**

This is a **weighted interpolation** between best and worst case. With the default `expected_case_position = 0.6`, the expected value sits 60% of the way from best to worst.

**Effect on planning:** This formula provides a systematic way to convert a range into a single expected value. The 0.6 position is slightly pessimistic—reflecting the common observation that most tasks have more ways to go wrong than right. Whether this matches reality for your team requires calibration against actual outcomes.

**Calibration:** Track whether your team typically delivers closer to best case, worst case, or in between. Adjust `expected_case_position` accordingly. If you consistently exceed estimates, increase toward 0.65-0.7. If you consistently beat estimates, decrease toward 0.4-0.5.

---

### Range Spread

**Formula:**
```
range_spread_hours = (worst_case_hours - best_case_hours) / range_spread_divisor
```

**What this actually is:**

This takes your estimation range (worst - best) and scales it down by a constant divisor. The result is a measure of estimation risk in hours.

**The scaling logic:**

If we assume your best/worst range captures roughly 90% of possible outcomes (as suggested in the calibration section), and if we further assume outcomes follow a roughly bell-shaped distribution, then dividing the range by 2.6 gives us a scaled measure we can use for statistical aggregation across the portfolio.

Different divisors would give different scaled measures:
- Divisor of 2.0 → larger spread (more conservative buffers)
- Divisor of 3.0 → smaller spread (less conservative buffers)

**How we use it:**

We aggregate this measure across the portfolio:
1. Square it to get variance
2. Add variances across the portfolio
3. Take square root to get portfolio range spread
4. Use it to calculate buffer levels (±1×, ±2×)

The math works correctly for portfolio planning when items are independent.

**Effect on planning:** Larger ranges produce larger range spread values, which create larger buffers in the final effort calculation. Items with high estimation risk drive the need for contingency.

**Critical**: This parameter needs calibration. Track whether your "worst case" scenarios actually represent ~85th percentile outcomes, ~95th percentile, or something else. Adjust the divisor accordingly.

---

### Variance

**Formula:**
```
variance = range_spread_hours²
```

**Why this formula:**

Variance is the mathematical foundation for **portfolio aggregation**. You cannot simply add the range spreads of independent work items—you must add their variances (squared values), then take the square root.

**Effect on planning:** This is a mathematical requirement for correct portfolio calculations, not a tunable parameter. Variance has no intuitive meaning on its own, but it's essential for correctly calculating portfolio range spread.

---

## Portfolio Aggregation (Multiple Work Items)

### Total Expected Effort

**Formula:**
```
total_expected_hours = Σ expected_hours_i
```
(Sum of all individual expected values)

**Why this formula:**

Expected values are **additive**. If Task A takes 10 hours on average and Task B takes 20 hours on average, the total is 30 hours on average. This is mathematically straightforward.

**Effect on planning:** This gives you the **most likely total effort** if all estimates are unbiased. However, this doesn't account for estimation risk—that's why we calculate portfolio range spread.

---

### Total Variance and Portfolio Range Spread

**Formulas:**
```
total_variance = Σ variance_i
portfolio_range_spread = √(total_variance)
```

**Why these formulas:**

This is where **statistical magic happens**. When you have N independent work items, their range spreads **don't simply add**. They combine via the **root-sum-square** formula.

**Example:** 
- 10 tasks, each with range spread = 10 hours
- If you naively add: 10 × 10 = 100 hours ❌
- Correct calculation: √(10 × 10²) = √1000 ≈ 31.6 hours ✅

**Why Root-Sum-Square?**  
Independent variations combine statistically, not linearly. This is **mathematical fact** from probability theory: when you add independent random variables, their variances add. 10 tasks with range spread=10 each give portfolio range spread=√(10×10²)=31.6, not 100.

**Critical assumption:** This assumes work items are **independent**. If Task B can't start until Task A finishes, or if they share the same risk factors, they're correlated and this formula may understate the risk. For most portfolio planning, independence is a reasonable approximation, but be aware of this limitation.

---

## Effort Estimation (Resource Planning)

The effort estimate incorporates a buffer based on range spread to support realistic resource planning.

### Total Effort with Range Spread Buffer

**Formula:**
```
total_effort_hours = total_expected_hours + portfolio_range_spread
```

**Why this formula:**

This adds a **1× range spread buffer** to the expected effort, targeting approximately 84% confidence.

**Effect on planning:** This is your planning number for staffing. If you staff exactly to the expected value (without the buffer), you'll overrun roughly 50% of the time because you haven't accounted for estimation spread.

---

### Effort in Staff Weeks

**Formula:**
```
total_effort_staff_weeks = total_effort_hours / billable_hours_per_week
```

**Why this formula:**

This converts **pure work time** (hours of coding, testing, design) into **calendar time with people**. Not all hours in a work week are billable/productive. Meetings, email, context switches, and other overhead reduce productive time.

**Effect on planning:** With default `billable_hours_per_week = 36`, you're assuming 36/40 = 90% efficiency. This is a **rule of thumb**, not a scientifically derived ratio. Different environments vary significantly. Measure your actual productive time to calibrate this value.

**Mental model:** "If we have one person working full-time, they'll complete about 36 hours of productive work per week."

---

## Duration Estimation (Calendar Time)

### Project Duration

**Formula:**
```
scaled = duration_scaling_power × (total_effort_staff_weeks)^(1/3)
single_person = ⌈total_effort_staff_weeks⌉
duration_weeks = min(⌈scaled⌉, single_person)
```
Where ⌈⌉ denotes ceiling (round up to next integer).

The `min()` cap ensures that the duration estimate never exceeds the time a single person would need working sequentially. Without this cap, for very small projects the cube-root formula could paradoxically suggest a duration longer than one person doing all the work alone.

**Why this formula:**

This is the most complex formula in the model. It reflects the principle often called **Brooks's Law**: "Adding manpower to a late software project makes it later."

**The cube root relationship:**

Duration scales with effort raised to the **1/3 power**. This means:
- 2× effort → 1.26× duration (not 2×)
- 4× effort → 1.59× duration (not 4×)
- 8× effort → 2× duration (not 8×)

**Why sub-linear scaling?**

Adding more people to a project provides **diminishing returns** due to:
1. **Communication overhead**: N people require N(N-1)/2 communication channels
2. **Coordination costs**: More meetings, more synchronization
3. **Task dependencies**: Not all work can be parallelized
4. **Ramp-up time**: New team members need onboarding

**The 3.2 multiplier:**

This adjusts the cube-root relationship to match typical project constraints and coordination overhead patterns.

**Calibration:**

This parameter **requires calibration** to your environment. If projects consistently take longer than estimated, increase to 3.5-5.0. If you effectively parallelize work, decrease to 2.5-3.0. Track actual duration vs. predicted to adjust.

---

## Worked Example

Using the data from "Worksheet Example" tab with default constants:

### Input Data (Selected Items)

| Level 1 | Level 2 | Best Case (B) | Worst Case (W) |
|---------|---------|---------------|----------------|
| Layouts & schemas | Page 1 | 80 | 120 |
| Layouts & schemas | Page 2 | 70 | 200 |
| Layouts & schemas | Page 3 | 100 | 320 |
| Layouts & schemas | Page 4 | 40 | 80 |
| Layouts & schemas | Page 5 | 60 | 90 |
| Layouts & schemas | Nav & Footer | 80 | 160 |
| Contentstack | Environment & Language Config | 4 | 16 |
| Contentstack | Translations | 80 | 100 |
| Documentation & Handoff | Q&A | 40 | 100 |
| Documentation & Handoff | Readme, docs | 16 | 30 |

### Constants
- expected_case_position = 0.6
- range_spread_divisor = 2.6
- billable_hours_per_week = 36
- duration_scaling_power = 3.2

### Individual Item Calculations

**Item 1: Page 1 (best=80, worst=120)**
```
expected = 80 + 0.6 × (120 - 80) = 80 + 24 = 104 hours
range_spread = (120 - 80) / 2.6 = 40 / 2.6 ≈ 15.38 hours
variance = 15.38² ≈ 236.69
```

**Item 2: Page 2 (best=70, worst=200)**
```
expected = 70 + 0.6 × (200 - 70) = 70 + 78 = 148 hours
range_spread = (200 - 70) / 2.6 = 130 / 2.6 = 50 hours
variance = 50² = 2500.00
```

**Item 3: Page 3 (best=100, worst=320)**
```
expected = 100 + 0.6 × (320 - 100) = 100 + 132 = 232 hours
range_spread = (320 - 100) / 2.6 = 220 / 2.6 ≈ 84.62 hours
variance = 84.62² ≈ 7159.76
```

... (calculating all 10 items)

### Portfolio Totals

```
total_expected = 104 + 148 + 232 + 64 + 78 + 128 + 11.2 + 92 + 76 + 24.4
total_expected = 957.6 hours

total_variance = 236.69 + 2500.00 + 7159.76 + 236.69 + 133.14 + 946.75 + 21.30 + 59.17 + 532.54 + 28.99
total_variance = 11855.03

portfolio_range_spread = √11855.03 ≈ 108.88 hours
```

### Effort Calculation

```
total_effort_hours = 957.6 + 108.88 = 1066.48 hours

total_effort_staff_weeks = 1066.48 / 36 ≈ 29.62 staff weeks
```

### Duration Calculation

```
scaled = 3.2 × (29.62)^(1/3) = 3.2 × 3.091 = 9.89
single_person = ⌈29.62⌉ = 30
duration_weeks = min(⌈9.89⌉, 30) = min(10, 30) = 10 weeks
```

---

## Implementation Notes

### Validation Rules

**Input validation:**
1. `best_case_hours ≥ 0` — Negative effort is nonsensical
2. `worst_case_hours ≥ best_case_hours` — Worst can't be better than best
3. If `best_case_hours = worst_case_hours`, then `range_spread = 0` (no estimation risk)

**Constant validation:**
1. `expected_case_position` must be in range [0, 1]
   - 0 = expected equals best case (extremely optimistic)
   - 1 = expected equals worst case (extremely pessimistic)
   - Typical range: 0.3-0.7
2. `range_spread_divisor > 0` (typical range: 1.5-4.0)
3. `billable_hours_per_week > 0` (typical range: 30-40)
4. `duration_scaling_power > 0` (typical range: 2.5-5.0)
5. `coordination_cost_per_pair` must be in range [0.5, 8]

### Rounding and Display

**Precision guidelines:**
- **Hours**: Display to 2 decimal places (93.20 hours)
- **Staff weeks**: Display to 2 decimal places (25.15 weeks)
- **Duration**: Always round up (ceiling), display as integer (11 weeks)
- **Range spread**: Display to 2 decimal places for transparency

**Why round up duration?**

Ceiling function ensures you don't underestimate calendar time. If the formula gives 10.1 weeks, you need 11 weeks on the calendar. This is conservative but appropriate for planning.

### Edge Cases

**Single work item:**
- Portfolio formulas still apply (portfolio of one)
- Portfolio range spread equals item range spread
- Duration may seem long for small items—this reflects minimum coordination overhead

**Zero range (best = worst):**
- `range_spread = 0`
- `expected = best = worst`
- `total_effort = expected` (no buffer needed)
- Duration still applies (reflects coordination overhead, not estimation risk)

**Empty portfolio:**
- All values = 0
- UI should handle gracefully

**Very large portfolios (>100 items):**
- Portfolio range spread grows as √N, so spread grows sublinearly
- This is good—large portfolios are more predictable
- But ensure UI can handle many items performantly

---

## TypeScript Implementation Requirements

### Architecture

1. **Pure functions in `src/domain/estimation.ts`**
   - All formulas as testable pure functions
   - No side effects, no state access
   - Functions should accept constants as parameters

2. **No inline math in React components**
   - Components call domain functions
   - Components handle display logic only

3. **Computed values, not stored values**
   - Store only: `best_case_hours`, `worst_case_hours`, constants
   - Compute on-the-fly: `expected_hours`, `range_spread_hours`, `variance`
   - This ensures calculations stay consistent with inputs

4. **Constants in application state**
   - Constants must be user-adjustable
   - Provide defaults from this spec
   - Validate ranges when users change them
   - Consider "Reset to defaults" button

### Testing Requirements

All formulas must have **unit tests with vitest**:

1. **Individual item calculations**
   - Test with example data (Page 1: 80-120 hours)
   - Verify expected, range_spread, variance to 2 decimal places

2. **Portfolio aggregation**
   - Test with 10-item example dataset
   - Verify totals match worked example

3. **Edge cases**
   - Test with best = worst (zero range spread)
   - Test with single item
   - Test with empty portfolio

4. **Constant variations**
   - Test formulas with different constant values
   - Verify formulas still work correctly

5. **Validation**
   - Test that invalid inputs are rejected
   - Test boundary conditions

---

## Test Data

Use the "Worksheet Example" tab data for unit tests:

```typescript
const testWorkItems = [
  { id: 1, name: "Page 1", best_case_hours: 80, worst_case_hours: 120 },
  { id: 2, name: "Page 2", best_case_hours: 70, worst_case_hours: 200 },
  { id: 3, name: "Page 3", best_case_hours: 100, worst_case_hours: 320 },
  { id: 4, name: "Page 4", best_case_hours: 40, worst_case_hours: 80 },
  { id: 5, name: "Page 5", best_case_hours: 60, worst_case_hours: 90 },
  { id: 6, name: "Nav & Footer", best_case_hours: 80, worst_case_hours: 160 },
  { id: 7, name: "Environment & Language Config", best_case_hours: 4, worst_case_hours: 16 },
  { id: 8, name: "Translations", best_case_hours: 80, worst_case_hours: 100 },
  { id: 9, name: "Q&A", best_case_hours: 40, worst_case_hours: 100 },
  { id: 10, name: "Readme, docs", best_case_hours: 16, worst_case_hours: 30 }
];

const constants = {
  expected_case_position: 0.6,
  range_spread_divisor: 2.6,
  billable_hours_per_week: 36,
  duration_scaling_power: 3.2,
  coordination_cost_per_pair: 1
};

// Expected results (verify to 2 decimal places):
// total_expected_hours ≈ 957.60
// portfolio_range_spread ≈ 108.88
// total_effort_hours ≈ 1066.48
// total_effort_staff_weeks ≈ 29.62
// duration_weeks = 10
```

---

## References and Further Reading

- **McConnell, Steve. (2006).** *Software Estimation: Demystifying the Black Art.* Microsoft Press.
  - Comprehensive treatment of software estimation techniques and challenges
  
- **Brooks, Frederick P. (1975).** *The Mythical Man-Month.* Addison-Wesley.
  - Classic work on why adding people to late projects makes them later

---

## Continuous Improvement

As your organization uses this model, **track actual outcomes** against estimates:

1. **Calibrate constants** based on historical data
2. **Adjust expected_case_position** if you're systematically over/under
3. **Tune range_spread_divisor** if confidence levels don't match reality
4. **Revise duration_scaling_power** if durations are consistently off

**The goal isn't perfection—it's continuous improvement through measurement and adjustment.**
