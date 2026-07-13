# Creating a brand

Two paths: the factory CLI (automated, requires `ANTHROPIC_API_KEY`) or the manual path (hand-author `brand.json`, run only the steps you need).

---

## Prerequisites

```bash
npm install
```

For the factory path, set:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

---

## Path A — Factory CLI (recommended)

The `factory new` command chains all steps in order: palette → contrast → assets → copy → screenshots.

```bash
npm run factory -- new \
  --logo ./path/to/logo.svg \
  --name "Brand Name" \
  --tagline "Your tagline here." \
  --locales en,de \
  --bundleId com.example.mybrand
```

**Options:**

| Flag | Required | Default | Description |
|---|---|---|---|
| `--logo <path>` | yes | — | Path to a `.svg` file |
| `--name <name>` | yes | — | Display name, e.g. `"Café Aurora"` |
| `--tagline <text>` | no | `"Rewards for showing up."` | Short brand tagline |
| `--locales <list>` | no | `en,de` | Comma-separated; `en` and `de` supported |
| `--bundleId <id>` | no | auto-derived from slug | e.g. `com.example.mybrand` |
| `--skip-screenshots` | no | false | Skip Maestro; use when no emulator is running |

The slug is derived from `--name` by lowercasing, stripping diacritics, and replacing non-alphanumeric runs with hyphens. `"Café Aurora"` → `cafe-aurora`.

The command fails fast if any step fails. Check the per-step log lines and the summary table for the failure reason.

### Without an emulator

```bash
npm run factory -- new --logo ./logo.svg --name "My Brand" --skip-screenshots
```

Screenshots can be added later by running `factory:screenshots` standalone once an emulator is up.

---

## Path B — Manual

Use this when you want full control over the color palette, or when you already have a `brand.json` from a previous run and only need to regenerate specific outputs.

### 1. Create the brand directory and write brand.json

```bash
mkdir brands/my-brand
cp ./logo.svg brands/my-brand/logo.svg
```

Write `brands/my-brand/brand.json` matching the schema (`src/brand/schema.ts`):

```json
{
  "displayName": "My Brand",
  "slug": "my-brand",
  "bundleId": "com.example.mybrand",
  "tagline": "Rewards for showing up.",
  "locales": ["en", "de"],
  "logo": "logo.svg",
  "colors": {
    "primary":    "#3b5bdb",
    "onPrimary":  "#ffffff",
    "secondary":  "#7048e8",
    "accent":     "#0ca678",
    "background": "#0d1117",
    "surface":    "#161b22",
    "onSurface":  "#e6edf3"
  }
}
```

Validation rules (enforced by zod at every step):
- `slug` must match `/^[a-z0-9]+(-[a-z0-9]+)*$/`
- `bundleId` must match `/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/`
- All colors must be 6-digit hex (`#rrggbb`)
- `locales` must be non-empty, values `"en"` or `"de"` only

### 2. Validate WCAG contrast

```bash
npm run factory:contrast -- --brand my-brand --check
```

This reads `brand.json`, prints the contrast ratio table, and exits 1 if any pair is below target. No files are written.

To auto-adjust failing pairs (writes `brand.json` in place):

```bash
npm run factory:contrast -- --brand my-brand
```

### 3. Generate assets

```bash
npm run factory:assets -- --brand my-brand
```

Writes to `brands/my-brand/assets/`: `icon.png`, `adaptive-icon.png`, `adaptive-icon-bg.png`, `splash.png`, `favicon.png`.

### 4. Generate AI palette (optional — replaces colors in brand.json)

```bash
npm run factory:palette -- --brand my-brand
```

Requires `ANTHROPIC_API_KEY`. Writes `brands/my-brand/brand.draft.json`. Run `factory:contrast` afterward to promote to `brand.json`.

### 5. Generate store copy

```bash
npm run factory:copy -- --brand my-brand
```

Requires `ANTHROPIC_API_KEY`. Writes 5 `.txt` files per locale to `brands/my-brand/store/{en,de}/`:
`title.txt`, `subtitle.txt`, `description.txt`, `keywords.txt`, `releaseNotes.txt`.

### 6. Capture screenshots

Requires a running Android emulator (Pixel 7 / API 34) or iOS simulator (iPhone 15) with the brand app installed.

```bash
# Install the brand app first:
BRAND=my-brand npx expo run:android

# Then capture:
npm run factory:screenshots -- --brand my-brand
```

Writes framed PNGs to `brands/my-brand/screenshots/{en,de}/01-home.png` … `05-profile.png`.

---

## Boot the branded app

```bash
BRAND=my-brand npx expo start -c
```

The `-c` flag clears Metro's cache. Always required when switching brands.

---

## Validate before committing

```bash
npm run typecheck
npm run lint
npm run check:tokens
npm run check:brands
npm run factory:contrast -- --brand my-brand --check
BRAND=my-brand npx expo config --type public > /dev/null
```

These are the same checks the `brand-validate` CI workflow runs on every PR.
