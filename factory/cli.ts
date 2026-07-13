#!/usr/bin/env node
// factory/cli.ts — Phase 11 CLI entry point.
//
// Usage:
//   npm run factory -- new --logo ./path/logo.svg --name "Café Aurora"
//   npm run factory -- new --logo ./path/logo.svg --name "Café Aurora" --skip-screenshots

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { BrandSchema } from '../src/brand/schema';
import {
  assertInsideBrandDir,
  REPO_ROOT,
  type FactoryContext,
  type StepResult,
} from './lib/paths';
import { assetsStep }      from './steps/assets';
import { paletteStep }     from './steps/palette';
import { contrastStep }    from './steps/contrast';
import { copyStep }        from './steps/copy';
import { screenshotsStep } from './steps/screenshots';

// ── Slug generation ─────────────────────────────────────────────────────────

/** "Café Aurora" → "cafe-aurora". Handles diacritics, punctuation, spaces. */
function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')        // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // runs of non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, '');     // trim leading/trailing hyphens
}

// ── Placeholder brand colours (replaced by palette → contrast steps) ────────

const PLACEHOLDER_COLORS = {
  primary:    '#6366f1',
  onPrimary:  '#ffffff',
  secondary:  '#8b5cf6',
  accent:     '#06b6d4',
  background: '#0f0f23',
  surface:    '#1a1a2e',
  onSurface:  '#e2e8f0',
};

// ── Summary table ───────────────────────────────────────────────────────────

interface StepRecord {
  name:       string;
  durationMs: number;
  result:     StepResult | null;
  skipped:    boolean;
}

function printSummaryTable(records: StepRecord[]): void {
  const COL = [14, 10, 10, 14] as const;
  const HEADERS = ['Step', 'Duration', 'Status', 'Output'];

  const rows = records.map((r) => [
    r.name,
    r.skipped ? '—' : `${(r.durationMs / 1000).toFixed(1)}s`,
    r.skipped
      ? 'skipped'
      : r.result
        ? r.result.ok
          ? r.result.warnings.length > 0 ? '⚠ ok' : '✓'
          : '✗ FAIL'
        : '✗ FAIL',
    r.skipped
      ? '—'
      : r.result
        ? `${r.result.wrote.length} file${r.result.wrote.length !== 1 ? 's' : ''}`
        : '0 files',
  ]);

  const sep = () =>
    process.stdout.write(
      '  ' + COL.map((w) => '─'.repeat(w)).join('┼') + '\n',
    );
  const row = (cells: (string | undefined)[]) =>
    process.stdout.write(
      '  ' + cells.map((c, i) => (c ?? '').padEnd(COL[i] ?? 14)).join('│') + '\n',
    );

  process.stdout.write('\n');
  sep();
  row(HEADERS);
  sep();
  for (const r of rows) row(r);
  sep();
  process.stdout.write('\n');
}

// ── Step runner ─────────────────────────────────────────────────────────────

async function runStep(
  name: string,
  fn: (ctx: FactoryContext) => Promise<StepResult>,
  ctx: FactoryContext,
  records: StepRecord[],
): Promise<StepResult> {
  process.stdout.write(`\n▶  ${name}\n`);
  const t0 = Date.now();
  let result: StepResult;
  try {
    result = await fn(ctx);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`   Fatal: ${msg}\n`);
    result = { ok: false, wrote: [], warnings: [msg] };
  }
  const durationMs = Date.now() - t0;

  for (const w of result.warnings) {
    process.stdout.write(`   ⚠️  ${w}\n`);
  }

  const fileCount = result.wrote.length;
  const label = result.ok
    ? result.warnings.length > 0
      ? `⚠ ok (${fileCount} file${fileCount !== 1 ? 's' : ''}, ${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''})`
      : `✓ ${fileCount} file${fileCount !== 1 ? 's' : ''}`
    : `✗ FAILED`;
  process.stdout.write(`   ${label}  (${(durationMs / 1000).toFixed(1)}s)\n`);

  records.push({ name, durationMs, result, skipped: false });
  return result;
}

// ── `new` command ───────────────────────────────────────────────────────────

async function runNew(options: {
  logo: string;
  name: string;
  bundleId?: string;
  tagline: string;
  locales: string;
  skipScreenshots: boolean;
}): Promise<void> {
  // ── 1. Validate logo ────────────────────────────────────────────────────
  const logoSrc = path.resolve(options.logo);
  if (!fs.existsSync(logoSrc)) {
    process.stderr.write(`Error: logo file not found: ${logoSrc}\n`);
    process.exit(1);
  }
  if (path.extname(logoSrc).toLowerCase() !== '.svg') {
    process.stderr.write(`Error: logo must be an SVG file (got ${path.extname(logoSrc)})\n`);
    process.exit(1);
  }

  // ── 2. Derive slug, bundleId ────────────────────────────────────────────
  const slug = toSlug(options.name);
  if (!slug) {
    process.stderr.write(`Error: could not derive a valid slug from name "${options.name}"\n`);
    process.exit(1);
  }

  const bundleId =
    options.bundleId ?? `com.rnbrandfactory.${slug.replace(/-/g, '')}`;

  const locales = options.locales
    .split(',')
    .map((l) => l.trim())
    .filter((l): l is 'en' | 'de' => l === 'en' || l === 'de');
  if (locales.length === 0) {
    process.stderr.write(`Error: --locales must include at least one of "en", "de"\n`);
    process.exit(1);
  }

  process.stdout.write(`\nCreating brand: ${options.name} (${slug})\n`);
  process.stdout.write(`  bundleId : ${bundleId}\n`);
  process.stdout.write(`  tagline  : ${options.tagline}\n`);
  process.stdout.write(`  locales  : ${locales.join(', ')}\n\n`);

  // ── 3. Create brands/<slug>/ and copy logo ──────────────────────────────
  const dir = path.join(REPO_ROOT, 'brands', slug);
  assertInsideBrandDir(slug, dir);
  fs.mkdirSync(dir, { recursive: true });

  const logoDest = path.join(dir, 'logo.svg');
  assertInsideBrandDir(slug, logoDest);
  fs.copyFileSync(logoSrc, logoDest);
  process.stdout.write(`  Copied logo → brands/${slug}/logo.svg\n`);

  // ── 4. Write starter brand.json with placeholder colours ────────────────
  //    palette step reads brand.json for identity (displayName, bundleId …).
  //    Placeholder colours are valid BrandSchema hex; palette → contrast will
  //    replace them with real brand-derived values.
  const starterBrand = {
    displayName: options.name,
    slug,
    bundleId,
    tagline: options.tagline,
    locales,
    logo: 'logo.svg',
    colors: PLACEHOLDER_COLORS,
  };
  BrandSchema.parse(starterBrand); // assert valid before writing
  const brandJsonPath = path.join(dir, 'brand.json');
  assertInsideBrandDir(slug, brandJsonPath);
  fs.writeFileSync(brandJsonPath, JSON.stringify(starterBrand, null, 2) + '\n', 'utf-8');
  process.stdout.write(`  Wrote starter brands/${slug}/brand.json\n`);

  // ── 5. Build FactoryContext ─────────────────────────────────────────────
  const ctx: FactoryContext = {
    slug,
    brandDir: dir,
    logoPath: logoDest,
    log: (msg: string) => process.stdout.write(`   ${msg}\n`),
  };

  // ── 6. Run steps in architecture order ─────────────────────────────────
  //    palette → contrast  (AI colors + WCAG adjust → final brand.json)
  //    assets              (needs real colors for icon/splash background)
  //    copy                (store text)
  //    screenshots         (optional, requires running emulator)
  const records: StepRecord[] = [];

  const palette = await runStep('palette',  paletteStep,  ctx, records);
  if (!palette.ok) { printSummaryTable(records); process.exit(1); }

  const contrast = await runStep('contrast', contrastStep, ctx, records);
  if (!contrast.ok) { printSummaryTable(records); process.exit(1); }

  const assets = await runStep('assets', assetsStep, ctx, records);
  if (!assets.ok) { printSummaryTable(records); process.exit(1); }

  const copy = await runStep('copy', copyStep, ctx, records);
  if (!copy.ok) { printSummaryTable(records); process.exit(1); }

  if (options.skipScreenshots) {
    records.push({ name: 'screenshots', durationMs: 0, result: null, skipped: true });
    process.stdout.write('\n▶  screenshots  (skipped via --skip-screenshots)\n');
  } else {
    const screenshots = await runStep('screenshots', screenshotsStep, ctx, records);
    if (!screenshots.ok) { printSummaryTable(records); process.exit(1); }
  }

  // ── 7. Summary table ────────────────────────────────────────────────────
  process.stdout.write('\n✅  Brand creation complete\n');
  printSummaryTable(records);
}

// ── Commander program ───────────────────────────────────────────────────────

const program = new Command();

program
  .name('factory')
  .description('rn-brand-factory — white-label brand generation CLI')
  .version('1.0.0');

program
  .command('new')
  .description('Create a new brand end-to-end from a logo SVG')
  .requiredOption('--logo <path>', 'Path to the brand logo SVG')
  .requiredOption('--name <name>', 'Brand display name, e.g. "Café Aurora"')
  .option('--bundleId <id>',      'iOS/Android bundle ID (auto-generated if omitted)')
  .option('--tagline <text>',     'Brand tagline', 'Rewards for showing up.')
  .option('--locales <list>',     'Comma-separated locales (en,de)', 'en,de')
  .option('--skip-screenshots',   'Skip the screenshots step (no emulator required)')
  .action((opts: {
    logo:             string;
    name:             string;
    bundleId?:        string;
    tagline:          string;
    locales:          string;
    skipScreenshots:  boolean;
  }) => {
    runNew(opts).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`\nFatal: ${msg}\n`);
      process.exit(1);
    });
  });

program.parse(process.argv);
