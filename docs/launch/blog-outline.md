# Blog Outline

Working title: "I built an app factory where the human is optional"

Target: dev.to + personal blog. Estimated length: 2,000–2,500 words.
Tone: direct, technical, no hype. Show the tradeoffs alongside the wins.

---

## 1. The white-label problem at agencies

- Agencies delivering the same membership/loyalty app to multiple clients spend
  most of their time on work that shouldn't require thought: swap the logo,
  change the colors, re-write the store listing, re-capture screenshots. The
  app behavior is identical; the packaging is not.
- The usual approach — a shared component library with per-client overrides —
  still requires a developer to wire up each new client, run the release
  pipeline, and manually verify that nothing leaked through. It scales to maybe
  five clients before it becomes a coordination problem.
- The goal here was: drop in a logo, get a submission-ready package out the
  other side, with a human only reviewing the output, not producing it.

---

## 2. Why 7 seed colors + deterministic derivation — not a full AI palette

- Asking an LLM to generate a complete 14-color theme (primary, muted, border,
  success, error, pressed states, tier colors…) produces hallucinated hex values
  that fail contrast checks at an unpredictable rate. The surface area for error
  is proportional to the number of things you ask the model to decide.
- Constraining the output to 7 seed colors — `primary`, `onPrimary`,
  `secondary`, `accent`, `background`, `surface`, `onSurface` — makes the
  extraction task tractable. The model only has to identify what's visually
  dominant in the logo. Everything else (`primaryMuted`, `border`,
  `surfaceElevated`, tier progression colors) is computed by `buildTheme()` via
  deterministic tint/shade math.
- The secondary benefit: when something is wrong in the derived colors, there is
  exactly one place to look — `buildTheme()` — rather than 14 AI-generated
  values each of which could independently be the source of the problem.

---

## 3. The draft → WCAG gate → promote pattern for trusting LLM output

- The palette step writes `brand.draft.json`, never `brand.json` directly. The
  contrast step reads the draft, runs WCAG AA checks on four foreground/background
  pairs, adjusts only the foreground roles (never the identity colors — primary,
  secondary, background), then writes `brand.json` and deletes the draft.
- This means a color never lands in the app without passing a deterministic
  correctness check. The LLM's job is to produce something in the right
  neighborhood; the contrast gate handles the last mile.
- The pattern generalizes: any LLM output that will be used in a production
  system should pass through a validation step that runs without the LLM, is
  reproducible, and fails loudly. The `structuredOutput()` helper in this repo
  applies the same idea to schema validation — zod parse failures are fed back
  as retry prompts, but the gate is always the zod schema, never trust in the
  raw text.

---

## 4. The deterministic cross-check on the vision model

- Vision models can hallucinate colors that aren't in the image, especially when
  the logo has anti-aliasing, gradients, or a transparent background rasterized
  on white.
- `factory/lib/colors.ts` quantizes the rasterized logo using `sharp`'s
  statistics to extract dominant pixel clusters. If the LLM's `primary` pick
  isn't within ΔE tolerance of any dominant cluster, the deterministic candidate
  wins.
- This isn't a fallback — it runs on every extraction. The LLM output is a
  candidate that gets checked, not an answer that gets used. Two independent
  methods agreeing is the signal that the color is trustworthy.
- The cost is one extra `sharp` call per run. It has prevented several
  hallucinated palette submissions in testing without adding any latency
  perceptible to a user.

---

## 5. Maestro screenshots that survive re-theming (testIDs, not text)

- The obvious way to write a Maestro flow for a screen is to assert on visible
  text: `assertVisible: "Your Points"`. This breaks the moment you re-brand,
  because the store copy changes the label text.
- Every screen root and every interactive element in this app has a stable
  `testID` — kebab-case, defined at phase 1, never changed. Maestro flows
  target only testIDs: `assertVisible:\n  id: "home-screen"`. The five flows
  survive any brand switch, any copy change, any color change.
- The device profile is pinned (Pixel 7 / API 34 for Android, iPhone 15 for
  iOS sim) and animations are suppressed under `E2E=1`. This covers two of the
  three most common sources of Maestro flakiness. The third — emulator cold
  starts — is addressed by `extendedWaitUntil` on each screen root.

---

## 6. What I'd cut in v2

- The `--skip-screenshots` flag exists because screenshots require a running
  emulator, which is the only step in the factory that isn't hermetic. In v2 I
  would run screenshots in a hosted emulator environment (Firebase Test Lab or
  similar) and remove the flag entirely.
- The store copy step generates German and English from the same LLM prompt
  section. German output tends toward formal register and sometimes runs over the
  character limits on the first attempt (German averages ~30% longer than
  English for the same semantic content). A dedicated DE prompt with tighter
  length constraints would reduce retry rate.
- The `buildTheme()` derivation for spacing and typography is constant across
  all brands. Per-brand type scales are architecturally possible (family is
  already a token) but weren't in scope. A v2 with a second `brand.json` field
  — `typescale: "compact" | "default" | "display"` — would meaningfully
  differentiate brands that currently look identical in layout.

---

## 7. Honest limitations

- **Spacing and type scale are the same for every brand.** Color and assets do
  the differentiation. If two clients have similar primary colors, their apps
  look nearly identical.
- **Store submission is staged, not executed.** The fastlane lanes copy files
  into `fastlane/metadata/` and call `deliver`. Credentials and API keys are the
  operator's responsibility; nothing is committed to the repo and nothing is
  submitted automatically.
- **Feature list is hardcoded** in `factory/steps/copy.ts`. The store copy
  describes the five screens that exist. Extending the app requires updating
  that list manually — there is no introspection of the screen tree.
- **The emulator requirement for screenshots** is a hard dependency that CI
  cannot satisfy. The CI workflow skips the screenshot step and validates
  everything else.
- The 14-phase build approach — one Claude Code session per phase — made drift
  control possible. It also means the repo took much longer to build than a
  single-session implementation would have. For a team project, the phase
  discipline is probably overkill; for a solo build where you want the AI to
  stay in its lane, it worked.

---

## 8. Links

- Repo: [placeholder — add GitHub URL after publishing]
- Demo video: [placeholder — add YouTube/Vimeo URL]
- Expo SDK 54 docs: https://docs.expo.dev
- Maestro docs: https://maestro.mobile.dev
- WCAG AA contrast guidelines: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum
