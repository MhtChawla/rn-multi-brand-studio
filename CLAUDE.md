# CLAUDE.md — rn-brand-factory project rules

You are working inside **rn-brand-factory**: one Expo (SDK 54, TypeScript strict, expo-router) membership/rewards app that a factory pipeline re-brands per client (theme, native identity, icons/splash, DE/EN store copy, framed screenshots). Read `ARCHITECTURE.md` before writing code. These rules override anything else, including your own judgment about "improvements".

## Phase discipline (most important rule)

- Work is delivered in 14 fixed phases (see `PHASES.md`). The user's prompt states the current phase. Build **only** what that phase specifies.
- NEVER build ahead: no stubs, placeholders, TODO scaffolding, empty folders, interfaces, or "preparing for later" code for future phases.
- NEVER refactor, rename, or "clean up" code from earlier phases unless the prompt explicitly says so. No drive-by changes.
- If the phase seems to require touching an out-of-scope file, STOP and ask instead of doing it.
- Do not create files outside the locations named in the phase prompt.

## Theming rules (zero tolerance)

- Raw style values (hex/rgb/hsl colors, `fontSize`, `fontFamily`, `lineHeight`, spacing numbers, radius numbers, shadow values) may exist **only** inside `src/theme/`.
- Everything else consumes tokens via `useTheme()`. Screens in `app/` compose components from `src/components/`; they do not define StyleSheets with raw values.
- `transparent`, `0`, and flex/layout numbers (`flex: 1`, percentages) are allowed anywhere. Colors and type/spacing/radius scales are not.
- Never bypass with `as any`, string concat of hex, or importing token constants directly instead of `useTheme()` (themes are per-brand at runtime; direct constant imports break re-branding).
- Gate: `npm run check:tokens` must pass before you consider any task done.

## TypeScript & code rules

- `strict` mode; no `any`, no `@ts-ignore` / `@ts-expect-error`, no non-null `!` unless provably safe with a comment.
- No new dependencies unless the phase prompt names them. If you believe one is needed, stop and ask.
- All brand config parsing goes through `BrandSchema` in `src/brand/schema.ts` — never hand-roll validation, never duplicate the schema.
- Mock data (`src/data/mock.ts`) is deterministic: fixed dates, fixed IDs, no `Date.now()`, no `Math.random()`.
- Every screen root and interactive element gets a stable `testID` (kebab-case, e.g. `home-screen`, `reward-card-0`) — Maestro depends on them.

## Factory rules (`/factory`)

- Factory scripts are Node-side TypeScript run via `tsx`. They may import `src/brand/schema.ts` only — never anything else from `src/` or `app/`.
- Every step implements the `FactoryStep` contract from ARCHITECTURE.md §3.3, is idempotent, and writes **only** inside `brands/<slug>/` (use `assertInsideBrandDir`).
- LLM calls only via `factory/lib/llm.ts` `structuredOutput()` with a zod schema. Never parse free-form LLM text ad hoc. Never log or commit API keys.

## Brand & identity rules

- `brand.json` must parse with `BrandSchema`. Never add fields to a brand.json without changing the schema in the same phase (and only if the phase says so).
- `app.config.ts` is the only place reading the `BRAND` env var. It must throw on unknown/invalid brands.
- Never commit `ios/` or `android/` directories (CNG only).

## Quality gates — run before declaring any phase done

```bash
npm run typecheck        # tsc --noEmit
npm run lint
npm run check:tokens     # scripts/check-token-leaks.sh
BRAND=default npx expo start -c   # must boot without red screen (when app is affected)
```

## Commits

- One commit per phase (unless the prompt says otherwise): `feat(phase-N): <summary>`.
- Fixes to a delivered phase: `fix(phase-N): <summary>`.
- No commit while any quality gate fails.

## Forbidden patterns — quick reference

```tsx
// ❌ color literal outside src/theme
<View style={{ backgroundColor: '#1a1a2e' }} />
// ❌ raw type scale
<Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold' }} />
// ❌ magic spacing
<View style={{ padding: 16 }} />
// ❌ building ahead
export function generateAssets() { /* TODO: phase 6 */ }
// ❌ dynamic brand import (Metro can't; also wrong layer)
const brand = require(`../../brands/${slug}/brand.json`);

// ✅ the only pattern
const t = useTheme();
<View style={{ backgroundColor: t.colors.surface, padding: t.spacing.lg }} />
```

## When finishing a task

Report: files created/modified, gates run + results, and explicitly confirm: "No files outside phase scope were touched. No raw style values outside src/theme."
