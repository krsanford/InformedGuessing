# Rough Math

[![Azure Static Web Apps CI/CD](https://github.com/krsanford/InformedGuessing/actions/workflows/azure-static-web-apps-proud-beach-0c6c9240f.yml/badge.svg)](https://github.com/krsanford/InformedGuessing/actions/workflows/azure-static-web-apps-proud-beach-0c6c9240f.yml)

**[www.roughmath.com](https://www.roughmath.com)**

A minimal React + TypeScript estimation workbench implementing two-point estimation for software projects.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Run tests
pnpm vitest run

# Run tests in watch mode
pnpm vitest
```

Then open http://localhost:5173/

## What This Does

Converts two-point estimates (best case / worst case) into actionable planning data:

- **Input:** Best and worst case hours for each work item
- **Output:** Expected effort, range spread (estimation risk), planning effort with buffer, and calendar duration

Based on the principle that single-point estimates hide uncertainty. Two-point estimation makes risk explicit and provides statistical foundation for portfolio planning.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Vitest** - Unit testing
- **pnpm** - Package manager (required, not npm)

## Project Structure

```
src/
├── domain/
│   ├── estimation.ts       # Pure functions for all estimation math
│   └── estimation.test.ts  # Comprehensive tests (33 tests)
├── App.tsx                 # Main app with useReducer state
├── main.tsx               # React bootstrap
└── index.css              # Minimal styling

docs/
└── estimation-math-spec.md # Complete mathematical specification
```

## Development Constraints

- ✅ Use **pnpm** only (not npm or yarn)
- ✅ All estimation logic in `src/domain/estimation.ts` as pure functions
- ✅ No inline math in React components
- ✅ Built-in browser capabilities preferred (no unnecessary dependencies)
- ✅ All math must match `docs/estimation-math-spec.md`
- ✅ All functions must have unit tests

## Key Math Concepts

### Two-Point Estimation
Instead of: "This will take 80 hours" (false precision)  
Use: "Best case: 60 hours, Worst case: 120 hours" (explicit uncertainty)

### Portfolio Aggregation
Range spreads combine via **root-sum-square**, not linear addition:
- 10 items with ±10 hours each = portfolio spread of ±31.6 hours (not ±100)
- Large portfolios are more predictable because variations cancel out

### Planning Buffer
- Expected effort = 50% confidence (you'll likely overrun)
- Expected + 1× range spread ≈ 84% confidence (recommended planning target)
- Expected + 2× range spread ≈ 97% confidence (high confidence)

## Running Tests

```bash
# Run all tests once
pnpm vitest run

# Watch mode (auto-rerun on changes)
pnpm vitest

# Run with coverage
pnpm vitest --coverage
```

All 33 tests verify calculations against worked examples in the specification.

## Debugging

Press `F5` in VS Code to launch Chrome with debugger attached, or manually open http://localhost:5173/ with dev tools.

## Math Specification

See [docs/estimation-math-spec.md](docs/estimation-math-spec.md) for:
- Complete mathematical formulas
- Worked examples with test data
- Calibration guidance for constants
- Theory and rationale

## Persistence

- No backend or authentication required
- Session data saved to localStorage
- Export/import as JSON with schema versioning
