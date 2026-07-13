# Architecture decisions

Six decisions that shape this codebase. Lifted from `ARCHITECTURE.md` §0 and §5. No new decisions are documented here.

---

## ADR-1: Token-only theming, enforced by CI grep

**Context.** AI-generated UI code frequently produces inline `#fff`, `fontSize: 16`, `padding: 12` literals. In a white-label codebase, a single hardcoded color breaks the re-brand promise silently — the app still compiles.

**Decision.** Raw style values (hex, `rgb()`, `fontSize`, `fontFamily`, spacing and radius numbers) may exist only in `src/theme/`. All other files consume values via `useTheme()`. `scripts/check-token-leaks.sh` greps for violations and is wired into the `brand-validate` CI workflow as a hard gate.

**Consequence.** Adding a new styled component requires importing `useTheme()` — one extra line. In exchange, switching a brand's color scheme requires changing only `brand.json`; no component file needs touching.

---

## ADR-2: Seven seed colors in brand.json, full palette derived in buildTheme

**Context.** Asking an LLM to produce a complete 14-color design token set reliably is difficult. The more colors specified, the more likely some will fail WCAG contrast or be internally inconsistent.

**Decision.** `brand.json` stores only seven seed colors: `primary`, `onPrimary`, `secondary`, `accent`, `background`, `surface`, `onSurface`. Everything else — `primaryMuted`, `surfaceElevated`, `onSurfaceMuted`, `border`, `success`, `error`, pressed states — is derived deterministically in `buildTheme()` via tint/shade math. WCAG auto-adjustment in `contrast.ts` targets only the four pairs involving seed foreground roles.

**Consequence.** The AI extraction task is tractable: extract seven colors from a logo image. Contrast fixing is local and deterministic. The trade-off is that brands cannot independently customize derived colors without changing `buildTheme()`.

---

## ADR-3: Brand identity injected at build time via extra.brand, not dynamic imports

**Context.** Metro bundler resolves module graphs statically at build time. A pattern like `require(\`../../brands/${slug}/brand.json\`)` cannot work — Metro cannot enumerate a dynamic path at bundle time.

**Decision.** `app.config.ts` reads `process.env.BRAND`, loads `brands/<slug>/brand.json`, validates it with `BrandSchema`, and writes the parsed object into `extra.brand`. At runtime, `loadBrand.ts` reads `Constants.expoConfig.extra.brand` and re-validates with the same schema. There are no dynamic filesystem or JSON-path imports in the app bundle.

**Consequence.** A brand switch requires a full rebuild (`BRAND=x npx expo start -c`). Incremental brand switching at runtime is not possible. This is accepted: the use case is building one binary per brand, not a runtime brand-switcher.

---

## ADR-4: AI colors stage via brand.draft.json; contrast gate promotes to brand.json

**Context.** The vision LLM can produce colors that fail WCAG contrast. Writing bad colors directly to `brand.json` risks them being committed and reaching production.

**Decision.** `palette.ts` writes `brand.draft.json`. `contrast.ts` reads the draft, runs WCAG AA checks on four role pairs, adjusts only foreground lightness values until targets are met, writes the corrected colors to `brand.json`, and deletes the draft. If contrast cannot be achieved within the lightness boundary, the step warns (exits ok) and flags for manual review. `brand.json` is never written before passing the contrast check.

**Consequence.** `brand.json` in the repo always represents a WCAG-AA-validated palette. The CI `--check` flag on `contrast.ts` re-validates without writing, so PRs that modify colors are gated automatically.

---

## ADR-5: CNG only — no committed ios/ or android/ directories

**Context.** Expo's Continuous Native Generation (CNG) derives `ios/` and `android/` from `app.config.ts` + `package.json`. Committing these directories causes them to diverge across brand configurations and complicates rebasing SDK upgrades.

**Decision.** `ios/` and `android/` are in `.gitignore`. Every native build starts from `expo prebuild --clean`. The CI `brand-build.yml` workflow does not assume a committed native directory. EAS Build runs prebuild server-side.

**Consequence.** Native customizations beyond what `app.config.ts` and Expo plugins support require a plugin. Ad-hoc edits to `ios/` are lost on the next prebuild. This is the intended constraint for a template repo.

---

## ADR-6: Single package.json — app and factory share one node_modules

**Context.** Factory scripts (`factory/`) need access to `src/brand/schema.ts` (the zod schema) to validate brand.json. A separate package would require publishing or path-aliasing the schema.

**Decision.** One `package.json` at the repo root covers both the Expo app and the factory Node scripts. Factory scripts are excluded from the app's TypeScript compile via `factory/tsconfig.json` (a Node-targeted config that extends the root). `factory/` imports only `src/brand/schema.ts` from the app side — no other `src/` or `app/` files.

**Consequence.** `node_modules` is shared, which means factory dependencies (`sharp`, `@anthropic-ai/sdk`, `commander`) ship in the same install as the app's dependencies. They are not bundled into the app (Metro excludes non-imported modules), but they appear in `package.json`. Acceptable for a template; a production setup might split into a workspace package.
