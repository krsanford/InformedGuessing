Project: Minimal React+TypeScript estimation workbench (no backend).
Goal: Faithfully reproduce the estimation logic documented in .github/estimation-math-spec.md.

Hard constraints:
- Use React + TypeScript.
- Do not use npm, you must use pnpm.
- Prefer built-in browser capabilities over libraries (native <details>/<summary>, plain <table>, CSS).
- Do not add dependencies unless absolutely necessary. If you propose one, justify it in one sentence.
- Use useReducer for app state. No Redux or other state libs.
- All estimation math must live in src/domain/estimation.ts as pure functions.
- No inline math in React components.
- All math must be unit-tested with vitest and must match the worked examples in docs/estimation-math-spec.md.
- No backend. No authentication.
- Persistence: save/load the entire session to localStorage. Provide Export JSON and Import JSON.
- Support schema versioning for exported/imported sessions.
- If any formula or constant is unclear, STOP and ask for clarification rather than guessing.

UI constraints:
- Single page with three sections:
  1) Inputs (editable grid)
  2) Advanced Variables (collapsible)
  3) Outputs (computed)
- Keep UI straightforward and keyboard-friendly.