# Demo Script — 100–120 second screen recording

Working title: "One codebase. Three clients. Zero manual rebranding."

---

## Pre-recording checklist

- [ ] Three emulator/simulator windows open and past the loading screen:
      `BRAND=cafe-aurora npx expo start -c`
      `BRAND=gym-forge npx expo start -c`
      `BRAND=ice-creamery npx expo start -c`
- [ ] Desktop layout: three windows tiled side by side (use a window manager or
      split-screen mode). All on the Home tab.
- [ ] Terminal: dark theme, font size 16+, at least 120 columns wide.
- [ ] `ANTHROPIC_API_KEY` exported in the shell you will record.
- [ ] A fresh, never-seen logo SVG ready at `~/Desktop/velvet-club-logo.svg`.
      (A simple single-color wordmark or geometric mark works best — the vision
      model's output is more visible when it has a clear dominant color to pull.)
- [ ] `npm install` and `npm run typecheck` both pass.
- [ ] `npm run check:brands` passes for the three existing brands.
- [ ] Recording software capturing at 1× retina. Audio: external mic, not system.

---

## Shot list

### 0:00 — Hook (10 seconds)

**On screen:** The three emulator windows side by side — Café Aurora (warm
copper palette), Gym Forge (dark green), Ice Creamery (pale blue). The same
Home screen layout is visible in all three: points balance at the top, tier
progress bar, reward cards below.

**Terminal commands:** none — these are already running.

**Voiceover:**
"Same codebase. Three clients. Zero manual rebranding. Everything you're about
to see comes from one command."

---

### 0:10 — The input (5 seconds)

**On screen:** Switch to a terminal in the project root. Run:

```
cp ~/Desktop/velvet-club-logo.svg ./velvet-club-logo.svg
ls -lh velvet-club-logo.svg
```

Show the file listed. One file, under 10 KB.

**Voiceover:**
"One file goes in: a logo. That's the entire specification for a new brand."

---

### 0:15 — Factory run starts (8 seconds)

**On screen:** Clear the terminal, then type and run:

```
npm run factory -- new \
  --logo ./velvet-club-logo.svg \
  --name "Velvet Club" \
  --tagline "Loyalty, redefined."
```

The CLI prints the brand creation header and begins the `palette` step:

```
Creating brand: Velvet Club (velvet-club)
  bundleId : com.rnbrandfactory.velvetclub
  tagline  : Loyalty, redefined.
  locales  : en, de

  Copied logo → brands/velvet-club/logo.svg
  Wrote starter brands/velvet-club/brand.json

▶  palette
```

**Voiceover:**
"The factory picks it up. Palette first — the vision model reads the logo and
extracts seven seed colors."

---

### 0:23 — Palette completes; contrast starts (7 seconds)

**On screen:** The palette step finishes:

```
▶  palette
   ✓ 1 file  (4.2s)

▶  contrast
   Source: brands/velvet-club/brand.draft.json
```

**Voiceover:**
"Seven seeds only. Every other color — muted text, borders, tier badges — is
derived deterministically. The LLM never touches those."

---

### 0:30 — Contrast table — PAUSE HERE (15 seconds)

**On screen:** The WCAG contrast report prints and the recording pauses on it.
Let the table sit for at least 8 seconds before the next cut.

```
  WCAG contrast report:
  ----------------------------+--------+--------+--------+----------+------
  Pair                        |Target  |Before  |After   |Adjusted  |Pass
  ----------------------------+--------+--------+--------+----------+------
  onPrimary / primary         |4.5:1   |2.83:1  |4.52:1  |yes       |✓
  onSurface / surface         |4.5:1   |5.21:1  |5.21:1  |no        |✓
  onSurface / background      |4.5:1   |8.44:1  |8.44:1  |no        |✓
  accent / background         |3.0:1   |1.94:1  |3.01:1  |yes       |✓
  ----------------------------+--------+--------+--------+----------+------
```

**Voiceover:**
"The contrast gate runs WCAG AA checks on four color pairs. No LLM involvement
— pure math. Failing foregrounds are adjusted deterministically. The LLM only
had to be roughly right."

---

### 0:45 — Assets and copy steps (10 seconds)

**On screen:** Terminal continues scrolling:

```
▶  contrast
   ✓ 1 file  (0.3s)

▶  assets
   ✓ 5 files  (2.1s)

▶  copy
   ✓ 10 files  (7.4s)
```

**Voiceover:**
"Icons and splash from the logo. Then ten store copy files — title, subtitle,
description, keywords, release notes — in both German and English."

---

### 0:55 — Summary table (5 seconds)

**On screen:** The final summary table prints:

```
✅  Brand creation complete

  ──────────────┼──────────┼──────────┼──────────────
  Step          │Duration  │Status    │Output
  ──────────────┼──────────┼──────────┼──────────────
  palette       │4.2s      │✓         │1 file
  contrast      │0.3s      │✓         │1 file
  assets        │2.1s      │✓         │5 files
  copy          │7.4s      │✓         │10 files
  screenshots   │—         │skipped   │—
  ──────────────┼──────────┼──────────┼──────────────
```

**Voiceover:**
"brand.json is validated and written. Boot the app."

---

### 1:00 — App boot (5 seconds)

**On screen:** New terminal tab, type and run:

```
BRAND=velvet-club npx expo start -c
```

Expo prints its startup output. The emulator loads — the new palette is
visible: a deep velvet background, the brand name in the header.

**Voiceover:**
"Same app. Different identity."

---

### 1:05 — Screen tour (15 seconds)

**On screen:** Tap through each tab in the emulator. Spend roughly 3 seconds on
each; pause for 4 seconds on the Card tab (membership card with QR code and
the new brand name printed below it).

Tabs in order: Home → Rewards → Card (pause) → Activity → Profile.

**Voiceover:**
"Home screen, rewards catalog, the membership card with the branded QR — five
screens, all re-themed from token calls. No screen-level style changes anywhere."

---

### 1:20 — Receipts (10 seconds)

**On screen:** Three quick cuts:

1. Terminal: `cat brands/velvet-club/store/de/description.txt`
   German description visible on screen (first 4–5 lines).

2. Terminal: `ls brands/velvet-club/screenshots/en/`
   Five framed PNGs listed: `01-home.png` … `05-profile.png`.

3. GitHub Actions page (or terminal output of the CI workflow): green checkmark
   on `brand-validate` — schema, contrast, token-leak, typecheck all passing.

**Voiceover:**
"German store copy, character-count validated. Framed screenshots. CI green on
the brand schema, contrast, and token-leak gates."

---

### 1:30 — Close (2 seconds)

**On screen:** Cut back to the original four-phone view — the three existing
brands still tiled, the new Velvet Club emulator added as a fourth.

**Voiceover:**
"Template repo in the description. Built with Claude Code, one phase at a time."

---

## Voiceover word count

| Shot | Words |
|------|-------|
| 0:00 Hook | 18 |
| 0:10 Input | 14 |
| 0:15 Factory run | 18 |
| 0:23 Palette | 17 |
| 0:30 Contrast table | 31 |
| 0:45 Assets + copy | 21 |
| 0:55 Summary | 7 |
| 1:00 Boot | 5 |
| 1:05 Screen tour | 26 |
| 1:20 Receipts | 22 |
| 1:30 Close | 13 |
| **Total** | **192** |

At 160 words per minute (relaxed narration pace), 192 words runs ~72 seconds of
speech across ~90 seconds of video — comfortable margin for pauses and the
silent contrast-table hold.
