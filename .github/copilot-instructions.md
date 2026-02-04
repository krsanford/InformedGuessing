Project: Minimal React+TypeScript estimation workbench (no backend).
Goal: Faithfully reproduce the estimation logic documented in .github/estimation-math-spec.md.

Hard constraints:
- Use React + TypeScript.
- Do not use npm, you must use pnpm.
- Prefer built-in browser capabilities over libraries (native <details>/<summary>, plain <table>, CSS).
- D3 is allowed only for data visualization if absolutely necessary.
- Use Vitest for unit testing.
- All estimation math must be in src/domain/estimation.ts as pure functions.
- All estimation math must match docs/estimation-math-spec.md.
- Do not use inline styles or CSS-in-JS. Use plain CSS.
- Do not add dependencies unless absolutely necessary. If you propose one, justify it in one sentence.
- Use useReducer for app state. No Redux or other state libs.
- All estimation math must live in src/domain/estimation.ts as pure functions.
- No inline math in React components.
- All math must be unit-tested with vitest and must match the worked examples in docs/estimation-math-spec.md.
- No backend. No authentication.
- Persistence: save/load the entire session to localStorage. Provide Export JSON and Import JSON.
- Support schema versioning for exported/imported sessions.
- If any formula or constant is unclear, STOP and ask for clarification rather than guessing.
- After any change, you must run all tests and check the console for any errors or warnings and fix them.
- After any change, if there are material additions or changes, ensure the UI, unit, and any other tests are all still valid, or if anything should be added/changed you must do so.
- For any file exceeding 200 lines, either refactor to reduce the size or split into multiple files.
- Do not add explanation or summary documents in my solution unless I explicitly request them. Only provide them in the chat.

UI constraints:
- Single page with three sections:
  1) Inputs (editable grid)
  2) Advanced Variables (collapsible)
  3) Outputs (computed)
- Keep UI straightforward and keyboard-friendly.