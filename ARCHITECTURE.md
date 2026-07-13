# rn-brand-factory — Architecture

Principal-architect reference. Everything below is fixed. Claude Code sessions must not deviate from this document or CLAUDE.md.

---

## 0. Opinionated defaults (locked)

| Decision | Choice |
|---|---|
| Expo SDK | 54, CNG only (no committed `ios/` / `android/`), new architecture on |
| Language | TypeScript strict, `noUncheckedIndexedAccess: true` |
| Router | expo-router (tabs layout) |
| Validation | zod v3 (`^3.24`) — shared by app + factory |
| Script runner | `tsx` (all `/factory` scripts run via `npx tsx`) |
| CLI framework | `commander` |
| Image processing | `sharp ^0.33` |
| LLM | `@anthropic-ai/sdk`, model `claude-sonnet-4-6` (vision + structured output). Key via `ANTHROPIC_API_KEY` env, never committed |
| Screenshots | Maestro CLI, device profiles: Pixel 7 / API 34 (Android), iPhone 15 (iOS sim) |
| Fonts | Inter via `@expo-google-fonts/inter` for ALL brands v1 (font-per-brand is out of scope; family is still a token) |
| Builds | EAS build, profiles in `eas.json` (`preview` = internal APK/sim, `production` = store) |
| Package layout | Single `package.json` ("monorepo-lite"): app + factory share one node_modules; factory imports the zod schema from `src/brand/schema.ts` |
| Node | 20 LTS |
| Commits | Conventional, phase-scoped: `feat(phase-N): summary` |

---

## 1. Final repo structure (state at end of phase 14)

Annotation: `[P#]` = phase that creates it.

```
rn-brand-factory/
├── CLAUDE.md                       [P1]  project rules for Claude Code
├── ARCHITECTURE.md                 [P1]  this file
├── README.md                       [P13] template-repo docs, badges, quickstart
├── PHASES.md                       [P1]  the 14-phase plan + status checkboxes
├── package.json                    [P1]
├── tsconfig.json                   [P1]  strict
├── app.config.ts                   [P4]  dynamic identity via BRAND env
├── eas.json                        [P4]
├── .eslintrc.js                    [P1]  incl. react-native/no-color-literals
├── .github/
│   └── workflows/
│       ├── brand-validate.yml      [P12] PR gate: schema, contrast, token-leak, typecheck
│       └── brand-build.yml         [P12] manual/tag: EAS build + store-asset artifacts per brand
├── .maestro/
│   └── flows/
│       ├── 01-home.yaml            [P10]
│       ├── 02-rewards.yaml         [P10]
│       ├── 03-card.yaml            [P10]
│       ├── 04-activity.yaml        [P10]
│       └── 05-profile.yaml         [P10]
├── app/                            expo-router — SCREENS ONLY, no logic
│   ├── _layout.tsx                 [P1]  root: fonts + ThemeProvider
│   └── (tabs)/
│       ├── _layout.tsx             [P1]  tab bar (themed)
│       ├── index.tsx               [P1]  Home: points balance + tier progress
│       ├── rewards.tsx             [P1]  Rewards catalog
│       ├── card.tsx                [P1]  Membership card (QR)
│       ├── activity.tsx            [P1]  Activity history
│       └── profile.tsx             [P1]  Profile
├── src/
│   ├── theme/                      THE ONLY place raw colors/sizes may exist
│   │   ├── tokens.ts               [P2]  Theme type + buildTheme(brand)
│   │   ├── ThemeProvider.tsx       [P2]
│   │   ├── useTheme.ts             [P2]
│   │   └── typography.ts           [P2]  Inter variants
│   ├── components/
│   │   ├── ui/                     [P1]  Screen, Text, Button, Card, Badge,
│   │   │                                 ProgressBar, ListItem — all token-driven
│   │   └── domain/                 [P1]  PointsBalance, TierProgress, RewardCard,
│   │                                     MembershipQR, ActivityRow
│   ├── data/
│   │   ├── types.ts                [P1]  Reward, Activity, Member, Tier
│   │   └── mock.ts                 [P1]  deterministic mock data (frozen dates)
│   └── brand/
│       ├── schema.ts               [P3]  zod BrandSchema — single source of truth
│       └── loadBrand.ts            [P4]  runtime: reads Constants.expoConfig.extra.brand
├── brands/
│   ├── default/                    [P3]
│   │   ├── brand.json
│   │   ├── logo.svg
│   │   ├── assets/                 generated: icon.png, adaptive-icon.png,
│   │   │                           adaptive-icon-bg.png, splash.png, favicon.png
│   │   ├── store/                  [P9]  {de,en}/description.txt, keywords.txt,
│   │   │                                 releaseNotes.txt, title.txt, subtitle.txt
│   │   └── screenshots/            [P10] {de,en}/01-home.png … 05-profile.png (framed)
│   ├── cafe-aurora/                [P5]  same shape
│   ├── gym-forge/                  [P5]  same shape
│   └── ice-creamery/               [P5]  same shape
├── factory/
│   ├── cli.ts                      [P11] `factory new` — chains steps 6–10
│   ├── steps/
│   │   ├── assets.ts               [P6]  logo.svg → icons/splash (sharp)
│   │   ├── palette.ts              [P7]  vision LLM → draft brand.json colors
│   │   ├── contrast.ts             [P8]  WCAG validate + auto-adjust
│   │   ├── copy.ts                 [P9]  LLM → DE/EN store copy
│   │   └── screenshots.ts          [P10] Maestro run + sharp framing
│   ├── lib/
│   │   ├── llm.ts                  [P7]  Anthropic wrapper: structuredOutput<T>(schema, prompt, retries)
│   │   ├── colors.ts               [P7]  hex utils, deterministic sharp-based palette fallback
│   │   ├── frame.ts                [P10] device frame + caption compositing
│   │   └── paths.ts                [P6]  brandDir(slug), assertInsideBrandDir guards
│   ├── templates/
│   │   └── store-copy.prompt.md    [P9]
│   └── tsconfig.json               [P6]  Node target + @types/node for all factory scripts
├── fastlane/
│   ├── Fastfile                    [P12] deliver/supply lanes reading brands/<slug>/store
│   └── Appfile                     [P12]
└── scripts/
    ├── check-token-leaks.sh        [P2]  grep gate: hex/rgb/fontSize literals outside src/theme
    └── check-brands.ts             [P3]  tsx gate: every brands/*/brand.json parses + logo exists
```

Note: `tsconfig.json` [P1] is legitimately touched in P3/P4 to `exclude` Node-context files (`scripts/`, `app.config.ts`) from the app compile. Once `factory/tsconfig.json` exists (P6), factory scripts use it and stop leaning on app-tsconfig excludes.

---

## 2. Data flow (logo in → store-ready app out)

```
                    ┌────────────────────────────────────────────┐
 client logo.svg ──▶│ factory/steps/palette.ts                   │
 + display name     │  claude-sonnet-4-6 vision → seed colors,   │
                    │  cross-checked vs sharp pixel-quantization │
                    └────────────────┬───────────────────────────┘
                                     ▼  draft brand.json
                    ┌────────────────────────────────────────────┐
                    │ factory/steps/contrast.ts                  │
                    │  WCAG AA check → auto-adjust L* → rewrite  │
                    └────────────────┬───────────────────────────┘
                                     ▼  validated brands/<slug>/brand.json  (zod gate)
        ┌────────────────────┬───────┴────────────┬─────────────────────┐
        ▼                    ▼                    ▼                     ▼
 app.config.ts        steps/assets.ts      steps/copy.ts        steps/screenshots.ts
 BRAND=<slug>         logo.svg → icon,     brand.json+features  BRAND=<slug> app on
 name, bundleId,      adaptive, splash     → DE/EN store text   emulator → Maestro
 scheme, icon paths,  (sharp)              (LLM, zod-validated  5 flows → raw shots
 extra.brand=json                          lengths)             → sharp framing+captions
        │                    │                    │                     │
        ▼                    ▼                    ▼                     ▼
 runtime ThemeProvider  brands/<slug>/      brands/<slug>/       brands/<slug>/
 buildTheme(extra.brand) assets/            store/{de,en}/       screenshots/{de,en}/
        └────────────────────┴────────┬───────────┴─────────────────────┘
                                      ▼
                       .github/workflows + eas.json + fastlane
                       → validated PR → EAS build artifact + store bundle
```

Key runtime decision: **brand.json is injected at build time by `app.config.ts` into `extra.brand`**. The app never does dynamic filesystem/JSON path imports (Metro can't). `loadBrand.ts` reads `Constants.expoConfig.extra.brand`, parses with the SAME zod schema, throws loudly on mismatch.

---

## 3. Key contracts

### 3.1 brand.json (zod — `src/brand/schema.ts`)

```ts
const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const BrandSchema = z.object({
  displayName: z.string().min(1).max(30),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  bundleId: z.string().regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/),
  tagline: z.string().max(80),
  locales: z.array(z.enum(["en", "de"])).nonempty(),
  logo: z.string().default("logo.svg"),
  colors: z.object({           // SEED colors only — full palette is derived
    primary: Hex,
    onPrimary: Hex,
    secondary: Hex,
    accent: Hex,
    background: Hex,
    surface: Hex,
    onSurface: Hex,
  }),
});
export type BrandConfig = z.infer<typeof BrandSchema>;
```

Deliberate: brand.json holds **7 seed colors only**. Everything else (muted text, borders, tier colors, success/error, pressed states) is derived deterministically in `buildTheme` via tint/shade math. Keeps AI extraction tractable and contrast fixing local.

### 3.2 Theme tokens (`src/theme/tokens.ts`)

```ts
export interface Theme {
  colors: {
    primary: string; onPrimary: string; primaryMuted: string;
    secondary: string; accent: string;
    background: string; surface: string; surfaceElevated: string;
    onSurface: string; onSurfaceMuted: string; border: string;
    success: string; error: string;
  };
  spacing: { xs: 4; sm: 8; md: 12; lg: 16; xl: 24; xxl: 32; xxxl: 48 };
  radius: { sm: 8; md: 12; lg: 20; full: 999 };
  typography: {
    family: { regular: string; medium: string; bold: string };
    variant: Record<"display"|"title"|"heading"|"body"|"caption"|"label",
      { fontFamily: string; fontSize: number; lineHeight: number }>;
  };
  elevation: { card: object; raised: object };
}
export function buildTheme(brand: BrandConfig): Theme { /* pure, deterministic */ }
```

Rule: components consume ONLY `useTheme()`. Spacing/radius/type scales are constants (not per-brand) — brands differentiate via color + assets + copy. That's the honest white-label tradeoff and it's stated in the README.

### 3.3 Factory step contract (`factory/steps/*`)

```ts
export interface FactoryContext {
  slug: string;
  brandDir: string;                 // absolute, brands/<slug>
  brand?: BrandConfig;              // present after palette+contrast
  logoPath: string;
  log: (msg: string) => void;
}
export interface StepResult { ok: boolean; wrote: string[]; warnings: string[]; }
export type FactoryStep = (ctx: FactoryContext) => Promise<StepResult>;
```

Invariants: every step is **idempotent**, writes **only inside `brands/<slug>/`** (enforced by `assertInsideBrandDir`), and is independently runnable: `npx tsx factory/steps/assets.ts --brand cafe-aurora`.

### 3.4 CLI (phase 11)

```
npm run factory -- new --logo ./in/logo.svg --name "Café Aurora" [--skip-screenshots]
```
Chain: palette → contrast → write brand.json → assets → copy → (screenshots if emulator detected). Prints a summary table of files written per step.

### 3.5 LLM structured-output helper (`factory/lib/llm.ts`)

```ts
structuredOutput<T>(schema: ZodSchema<T>, system: string, user: Content, maxRetries = 3, maxTokens = 512): Promise<T>
```
Prompts demand raw JSON only; response is stripped of fences, `JSON.parse`d, zod-parsed; on failure the zod error text is fed back into a retry turn. Temperature 0.2. This one function is the reliability backbone for phases 7 and 9.

---

## 4. Identity switching (`app.config.ts`)

```ts
const slug = process.env.BRAND ?? "default";
const brand = BrandSchema.parse(JSON.parse(readFileSync(`brands/${slug}/brand.json`, "utf8")));

// scheme must be a valid URI scheme: alphanumeric, no hyphens.
// "default" is a reserved-ish word we alias for clarity; hyphens are stripped.
const scheme = brand.slug === "default" ? "clubone" : brand.slug.replace(/-/g, "");

export default {
  name: brand.displayName,
  slug: "rn-brand-factory",
  scheme,
  ios: { bundleIdentifier: brand.bundleId },
  android: { package: brand.bundleId, adaptiveIcon: { foregroundImage: `./brands/${slug}/assets/adaptive-icon.png`, ... } },
  icon: `./brands/${slug}/assets/icon.png`,
  splash: { image: `./brands/${slug}/assets/splash.png`, backgroundColor: brand.colors.background },
  extra: { brand },
};
```
Scheme contract: `scheme = slug.replace(/-/g,"")`, with `default → "clubone"`. URI schemes can't contain hyphens, so `cafe-aurora` becomes `cafeaurora`. Missing/invalid brand ⇒ config throws ⇒ nothing builds. That's intentional.

---

## 5. Top 5 technical risks & mitigations

**R1 — Dynamic Expo config staleness & env propagation.** Switching BRAND doesn't reliably propagate: Metro caches, dev client keeps old identity, EAS build env differs from local shell. *Mitigations:* CNG-only (never commit `ios/`/`android/`); brand switches always via `BRAND=x npx expo start -c`; CI/EAS runs `npx expo prebuild --clean` per brand; BRAND declared in `eas.json` build profile env, not shell-assumed; `app.config.ts` hard-fails on unknown slug. Verification step in every relevant phase checklist.

**R2 — Token leakage (hardcoded styles creeping in).** AI-generated UI code loves inline `#fff` and `fontSize: 16`; one leak breaks the entire white-label promise. *Mitigations:* ESLint `react-native/no-color-literals` + `scripts/check-token-leaks.sh` (grep for `#[0-9a-fA-F]{3,8}`, `rgb(`, `fontSize:`, `fontFamily:` outside `src/theme/`) wired into CI as a hard gate from phase 2 onward; only `ui/` primitives touch StyleSheet color props; CLAUDE.md forbids it explicitly so sessions self-police.

**R3 — Vision-LLM palette unreliability.** Muddy/hallucinated hex, low-contrast picks, anti-aliasing artifacts read as colors. *Mitigations:* zod-validated structured output with retry loop; deterministic cross-check — sharp downsamples the rasterized logo and quantizes dominant pixels; if LLM primary isn't within ΔE tolerance of any dominant cluster, prefer the deterministic candidate; phase 8's WCAG auto-adjust is a deterministic corrector run on every output, so the LLM only has to be roughly right.

**R4 — Maestro flakiness.** Emulator timing, animation races, per-brand color changes breaking assertions. *Mitigations:* assertions target `testID`s only (mandated from phase 1), never text/colors; `extendedWaitUntil` on each screen root; animations minimized under `E2E=1`; deterministic mock data with frozen dates; single pinned device profile; flows run sequentially with one retry; screenshots taken via Maestro `takeScreenshot` then framed offline by sharp (framing can't flake the run).

**R5 — LLM store copy breaking store constraints.** Apple: description ≤4000 chars, keywords ≤100 chars, subtitle ≤30; Google: short description ≤80, full ≤4000; German runs ~20–30% longer and drifts into stiff marketing tone. *Mitigations:* copy schema encodes max lengths per field per store in zod; validation failure text (including char counts) fed back on retry; DE generated natively from a DE-specific prompt section (never translated from EN output); tone/banned-word rules in `store-copy.prompt.md`; final char-count table printed by the step so a human glance catches anything odd.

*(Runner-up, absorbed into R1: per-brand native identity — bundleId collisions and iOS scheme validity are caught by the zod regex + a CI uniqueness check across `brands/*/brand.json` in phase 12.)*

---

## 6. Phase → dependency map (for drift control)

```
P1+P2 (shell + tokens, built together)
  └─ P3 (schema + default brand) ─ P4 (dynamic config) ─ P5 (2 manual brands)
       └─ P6 (assets) ─ P7 (palette AI) ─ P8 (contrast) ─ P9 (copy AI) ─ P10 (screenshots)
            └─ P11 (CLI chain) ─ P12 (CI) ─ P13 (docs) ─ P14 (launch)
```
No phase may create files owned by a later phase.
