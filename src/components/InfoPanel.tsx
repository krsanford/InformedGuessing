import { useEffect, useRef } from 'react'
import styles from './InfoPanel.module.css'

interface InfoPanelProps {
  open: boolean
  onClose: () => void
}

export function InfoPanel({ open, onClose }: InfoPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      panelRef.current?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        role="dialog"
        aria-label="About Rough Math"
      >
        <button className={styles.close} onClick={onClose} aria-label="Close">
          &times;
        </button>

        <h2 className={styles.heading}>Rough Math</h2>
        <p className={styles.body}>
          A <strong>two-point estimation workbench</strong>. You give each work item a best-case and worst-case hour estimate, and the tool aggregates them into a portfolio-level forecast. The goal isn't precision &mdash; it's getting a defensible range that accounts for how uncertainty actually behaves when you combine many items together.
        </p>

        <details className={styles.section}>
          <summary className={styles.sectionTitle}>The estimation model</summary>
          <div className={styles.sectionContent}>
            <p className={styles.body}>
              For each item, you provide two numbers: best case and worst case hours. The tool derives two things from that range:
            </p>
            <ul className={styles.list}>
              <li><strong>Expected effort</strong> &mdash; a weighted point between your best and worst case, controlled by the <em>expected case position</em> parameter. By default it sits at 0.6 (closer to the worst case), reflecting that estimates tend to be optimistic.</li>
              <li><strong>Variance</strong> &mdash; a measure of how wide the uncertainty is. It's computed as the range divided by a <em>spread divisor</em>, then squared. A wider best-to-worst gap means more variance.</li>
            </ul>
            <p className={styles.body}>
              When the tool combines items into a portfolio, the expected values simply add up. But the variances add too &mdash; and the overall spread is the square root of the summed variances. This is the key: <em>spread grows with the square root, not linearly</em>. Ten items with moderate uncertainty don't produce ten times the spread &mdash; they produce roughly three times the spread. Some items will come in over, some under, and they partially cancel out.
            </p>
            <p className={styles.body}>
              This is sometimes called the "diversification effect" &mdash; the same principle behind portfolio theory in finance. The tool's diversification chart shows exactly how much tighter the combined spread is compared to naively summing each item's individual spread.
            </p>
          </div>
        </details>

        <details className={styles.section}>
          <summary className={styles.sectionTitle}>Duration and the cube-root rule</summary>
          <div className={styles.sectionContent}>
            <p className={styles.body}>
              Staff-weeks of effort don't translate directly into calendar weeks. Adding people adds coordination overhead and communication channels, so doubling the team doesn't halve the schedule. The tool uses a cube-root scaling model: calendar duration grows roughly as the cube root of total effort, multiplied by a tunable scaling factor.
            </p>
            <p className={styles.body}>
              This captures the empirical observation that larger projects need proportionally more calendar time, even with more people. The model caps duration so it never exceeds the single-person sequential time (you can't make a project take longer than one person doing it all).
            </p>
          </div>
        </details>

        <details className={styles.section}>
          <summary className={styles.sectionTitle}>Why staffing always exceeds the estimate</summary>
          <div className={styles.sectionContent}>
            <p className={styles.body}>
              If you build a staffing plan, you'll almost always find that total staffed hours are higher than the tool's effort estimate &mdash; and that's by design. A staffing plan has to account for things the estimation model deliberately ignores:
            </p>
            <ul className={styles.list}>
              <li><strong>Coordination overhead</strong> &mdash; N people create N(N-1)/2 communication channels. Standups, reviews, syncs, and context switching all consume real hours. The tool models this using Brooks's Law and shows the coordination cost explicitly.</li>
              <li><strong>Non-productive time</strong> &mdash; PTO, holidays, sick days, onboarding, meetings not related to the project. Real availability is always less than scheduled hours.</li>
              <li><strong>Ramp-up and ramp-down</strong> &mdash; people aren't fully productive on day one, and the tail end of a project has overhead too.</li>
              <li><strong>Schedule buffer</strong> &mdash; a healthy staffing plan has slack. The gap decomposition view breaks down exactly where the hours go: base effort, coordination overhead, and remaining buffer.</li>
            </ul>
            <p className={styles.body}>
              The comparison between estimated effort and staffed hours is a feature, not a bug. If your staffed hours are <em>below</em> the estimate, that's worth investigating.
            </p>
          </div>
        </details>

        <details className={styles.section}>
          <summary className={styles.sectionTitle}>Features</summary>
          <div className={styles.sectionContent}>
            <ul className={styles.list}>
              <li><strong>Work items</strong> &mdash; best/worst case estimation with optional titles, notes, and multipliers for repeated items. Toggle items on and off to explore scenarios.</li>
              <li><strong>Portfolio aggregation</strong> &mdash; combined expected effort and variance-based spread across all items, shown in the bottom status bar.</li>
              <li><strong>Insights charts</strong> &mdash; distribution curve, per-item uncertainty bars (sorted by risk contribution), effort breakdown at confidence levels, diversification comparison, and a duration scaling curve.</li>
              <li><strong>Staffing plan</strong> &mdash; per-person, per-week hour grid with annotations (type "PTO" or "Holiday" in a cell), cost tracking, and auto-population from estimates.</li>
              <li><strong>Gap decomposition</strong> &mdash; breaks the difference between staffed and estimated hours into coordination overhead and buffer.</li>
              <li><strong>Tunable parameters</strong> &mdash; expected case position, spread divisor, billable hours per week, duration scaling factor, and coordination cost per pair. Accessible via the gear icon.</li>
              <li><strong>Export/import</strong> &mdash; save and restore sessions as JSON. All data is also persisted to localStorage automatically.</li>
            </ul>
          </div>
        </details>

        <details className={styles.section}>
          <summary className={styles.sectionTitle}>Tunable parameters explained</summary>
          <div className={styles.sectionContent}>
            <ul className={styles.list}>
              <li><strong>Expected case position</strong> (default 0.6) &mdash; where between best (0) and worst (1) the expected value sits. Higher values are more conservative.</li>
              <li><strong>Spread divisor</strong> (default 2.6) &mdash; divides the best-to-worst range to get a measure of spread before squaring into variance. Larger values tighten the distribution; smaller values widen it.</li>
              <li><strong>Billable hours/week</strong> (default 36) &mdash; how many productive hours per person per week when converting effort to staff-weeks.</li>
              <li><strong>Duration scaling</strong> (default 3.2) &mdash; the multiplier in the cube-root duration formula. Higher values produce longer calendar durations for the same effort.</li>
              <li><strong>Coordination cost/pair</strong> (default 1) &mdash; hours of overhead per pair of active people per week. Drives the Brooks's Law coordination model.</li>
            </ul>
          </div>
        </details>

        <p className={styles.footnote}>
          The underlying model applies established techniques from statistical estimation, portfolio risk theory, and software scheduling research (Brooks, McConnell). It's a model, not a prophecy &mdash; but it tends to beat gut-feel padding and worst-case-everything budgets.
        </p>
      </div>
    </div>
  )
}
