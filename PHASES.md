# PHASES.md — rn-brand-factory build plan

Fixed scope and order. One phase per Claude Code session. Update the checkbox + status line only after the phase's verification checklist passes and the phase commit is made. Never start a phase while a previous one is unchecked.

Note: Phases 1 and 2 are built together in a single session (the UI cannot exist without tokens), but are verified and tracked separately.

- [ ] **Phase 1 — App shell (5 screens, mock data, polished UI)**
  Home (points balance + tier progress), Rewards catalog, Membership card (QR), Activity history, Profile. expo-router tabs, deterministic mock data, `testID` on every screen root + interactive element. Owns: `app/`, `src/components/`, `src/data/`.

- [ ] **Phase 2 — Token theming system** *(built alongside Phase 1)*
  `Theme` type, `buildTheme()`, `ThemeProvider`, `useTheme()`, typography (Inter). Raw style values exist only in `src/theme/`. Owns: `src/theme/`, `scripts/check-token-leaks.sh`.

- [ ] **Phase 3 — brand.json schema + default brand**
  Zod `BrandSchema` in `src/brand/schema.ts` (single source of truth), `/brands/default/` with brand.json, logo.svg, placeholder assets. Owns: `src/brand/schema.ts`, `brands/default/`.

- [ ] **Phase 4 — Dynamic app.config.ts (BRAND env switching)**
  Identity (name, bundleId, scheme, icons, splash) resolved from `brands/<BRAND>/brand.json`; brand injected into `extra.brand`; `loadBrand.ts` consumes it at runtime; hard-fail on unknown/invalid brand. Owns: `app.config.ts`, `eas.json`, `src/brand/loadBrand.ts`.

- [ ] **Phase 5 — Two manual brands (café + gym)**
  `brands/cafe-aurora/` and `brands/gym-forge/` hand-authored, proving full end-to-end switch: `BRAND=cafe-aurora` / `BRAND=gym-forge` boot with distinct identity + theme. No factory code.

- [ ] **Phase 6 — Asset generator (sharp)**
  `factory/steps/assets.ts` + `factory/lib/paths.ts`: logo.svg → icon.png, adaptive-icon(+bg).png, splash.png, favicon.png into `brands/<slug>/assets/`. Idempotent, standalone-runnable.

- [ ] **Phase 7 — Logo→brand AI (vision palette)**
  `factory/steps/palette.ts` + `factory/lib/llm.ts` (`structuredOutput`) + `factory/lib/colors.ts`: claude-sonnet-4-6 vision extracts 7 seed colors, cross-checked against sharp pixel-quantization; drafts brand.json.

- [ ] **Phase 8 — Contrast validator (WCAG)**
  `factory/steps/contrast.ts`: AA checks on seed pairs (onPrimary/primary, onSurface/surface, etc.), deterministic lightness auto-adjust, rewrites brand.json, reports before/after ratios.

- [ ] **Phase 9 — AI store copy (DE/EN)**
  `factory/steps/copy.ts` + `factory/templates/store-copy.prompt.md`: brand.json + feature list → title, subtitle, description, keywords, release notes per locale into `brands/<slug>/store/{de,en}/`; store char limits enforced in zod.

- [ ] **Phase 10 — Auto screenshots (Maestro + framing)**
  `.maestro/flows/01–05`, `factory/steps/screenshots.ts`, `factory/lib/frame.ts`: run app with BRAND=slug, capture 5 screens, sharp-composite device frame + captions into `brands/<slug>/screenshots/{de,en}/`.

- [ ] **Phase 11 — `factory new` CLI**
  `factory/cli.ts` (commander): chains palette → contrast → brand.json write → assets → copy → screenshots (`--skip-screenshots` supported); summary table of files written.

- [ ] **Phase 12 — GitHub Actions CI**
  `brand-validate.yml` (PR gate: schema, bundleId uniqueness, contrast, token-leak grep, typecheck, lint) + `brand-build.yml` (EAS build + store-asset artifacts per brand) + fastlane lanes.

- [ ] **Phase 13 — Polish & template docs**
  README (quickstart, badges, GIFs), architecture diagram, template-repo setup docs, contribution notes.

- [ ] **Phase 14 — Demo video script + launch plan**
  Recorded demo flow script, blog post outline, LinkedIn/launch sequencing. No code.

## Status

Current phase: **not started**
Last completed: —
