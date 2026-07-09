// Phase 8 — WCAG contrast validation + deterministic auto-adjust.
// Reads brand.draft.json (falls back to brand.json), checks four role pairs,
// adjusts only foreground roles (onPrimary, onSurface, accent), writes final
// brand.json, and promotes the draft by deleting it on success.
//
// No LLM — pure deterministic color math via factory/lib/colors.ts.

import * as fs from 'fs';
import * as path from 'path';
import { BrandSchema } from '../../src/brand/schema';
import type { BrandConfig } from '../../src/brand/schema';
import {
  assertInsideBrandDir,
  brandDir,
  REPO_ROOT,
  type FactoryContext,
  type FactoryStep,
  type StepResult,
} from '../lib/paths';
import { contrastRatio, adjustForContrast } from '../lib/colors';

// ── Pair definitions ───────────────────────────────────────────────────────

type ColorKey = keyof BrandConfig['colors'];

interface Pair {
  label: string;
  fg: ColorKey;
  bg: ColorKey;
  /** WCAG target: 4.5 = AA normal text; 3.0 = AA large/graphical. */
  target: number;
}

// Identity colors (primary, secondary, background, surface) are never touched.
// Only foreground roles (onPrimary, onSurface, accent) may be adjusted.
const PAIRS: Pair[] = [
  { label: 'onPrimary / primary',    fg: 'onPrimary', bg: 'primary',    target: 4.5 },
  { label: 'onSurface / surface',    fg: 'onSurface', bg: 'surface',    target: 4.5 },
  { label: 'onSurface / background', fg: 'onSurface', bg: 'background', target: 4.5 },
  { label: 'accent / background',    fg: 'accent',    bg: 'background', target: 3.0 },
];

// ── Report helpers ─────────────────────────────────────────────────────────

interface PairResult {
  label: string;
  target: number;
  before: number;
  after: number;
  adjusted: boolean;
  pass: boolean;
}

function formatRatio(r: number): string {
  return r.toFixed(2) + ':1';
}

function printTable(rows: PairResult[]): void {
  const COL = [28, 8, 8, 8, 10, 6];
  const header = ['Pair', 'Target', 'Before', 'After', 'Adjusted', 'Pass'];
  const line = () => process.stdout.write('  ' + COL.map(w => '-'.repeat(w)).join('+') + '\n');

  const row = (cells: string[]) =>
    process.stdout.write(
      '  ' + cells.map((c, i) => c.padEnd(COL[i] ?? 8)).join('|') + '\n',
    );

  line();
  row(header);
  line();
  for (const r of rows) {
    row([
      r.label,
      r.target.toFixed(1) + ':1',
      formatRatio(r.before),
      formatRatio(r.after),
      r.adjusted ? 'yes' : 'no',
      r.pass ? '✓' : '✗ FAIL',
    ]);
  }
  line();
}

// ── FactoryStep ────────────────────────────────────────────────────────────

export const contrastStep: FactoryStep = async (
  ctx: FactoryContext,
): Promise<StepResult> => {
  const wrote: string[] = [];
  const warnings: string[] = [];

  // ── 1. Resolve source: draft takes priority over existing brand.json ───────
  const draftPath     = path.join(ctx.brandDir, 'brand.draft.json');
  const brandJsonPath = path.join(ctx.brandDir, 'brand.json');

  const sourcePath = fs.existsSync(draftPath) ? draftPath : brandJsonPath;
  if (!fs.existsSync(sourcePath)) {
    return {
      ok: false,
      wrote,
      warnings: [`Neither brand.draft.json nor brand.json found in brands/${ctx.slug}`],
    };
  }

  const source = BrandSchema.parse(
    JSON.parse(fs.readFileSync(sourcePath, 'utf-8')),
  );

  ctx.log(`Source: ${path.relative(REPO_ROOT, sourcePath)}`);

  // ── 2. Work on a mutable copy; keep originals for the before column ───────
  const originalColors = { ...source.colors };
  const colors = { ...source.colors };

  const results: PairResult[] = [];

  // ── 3. Check + adjust each pair in order ─────────────────────────────────
  //    Pairs sharing a foreground (both onSurface pairs) benefit from
  //    earlier adjustments: the first pair that adjusts onSurface may also
  //    fix the second. Processing in definition order is intentional.
  for (const pair of PAIRS) {
    const before = contrastRatio(originalColors[pair.fg], originalColors[pair.bg]);
    const currentRatio = contrastRatio(colors[pair.fg], colors[pair.bg]);

    if (currentRatio >= pair.target) {
      results.push({
        label: pair.label,
        target: pair.target,
        before,
        after: currentRatio,
        adjusted: false,
        pass: true,
      });
      continue;
    }

    // Adjust the foreground role toward the target.
    const adjusted = adjustForContrast(colors[pair.fg], colors[pair.bg], pair.target);
    colors[pair.fg] = adjusted.hex;

    const pass = adjusted.ratio >= pair.target;
    if (!pass) {
      warnings.push(
        `${pair.label}: target ${pair.target}:1 could not be reached ` +
          `(achieved ${adjusted.ratio.toFixed(2)}:1 at lightness boundary). ` +
          `Manual adjustment required.`,
      );
    }

    results.push({
      label: pair.label,
      target: pair.target,
      before,
      after: adjusted.ratio,
      adjusted: true,
      pass,
    });
  }

  // ── 4. Print before/after table ───────────────────────────────────────────
  process.stdout.write('\n  WCAG contrast report:\n');
  printTable(results);

  // ── 5. Validate final colors with BrandSchema before writing ──────────────
  const finalBrand: BrandConfig = {
    ...source,
    colors,
  };

  // BrandSchema.parse throws if any field is invalid (e.g. bad hex).
  // This is the last safety net before touching disk.
  BrandSchema.parse(finalBrand);

  // ── 6. Write brand.json ───────────────────────────────────────────────────
  assertInsideBrandDir(ctx.slug, brandJsonPath);
  fs.writeFileSync(brandJsonPath, JSON.stringify(finalBrand, null, 2) + '\n', 'utf-8');
  wrote.push(brandJsonPath);
  ctx.log(`Wrote ${path.relative(REPO_ROOT, brandJsonPath)}`);

  // ── 7. Promote draft: delete brand.draft.json on success ─────────────────
  if (sourcePath === draftPath && fs.existsSync(draftPath)) {
    assertInsideBrandDir(ctx.slug, draftPath);
    fs.unlinkSync(draftPath);
    ctx.log(`Deleted ${path.relative(REPO_ROOT, draftPath)} (promoted to brand.json)`);
  }

  return { ok: true, wrote, warnings };
};

// ── Standalone runner ──────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const brandFlagIdx = args.indexOf('--brand');
  const rawSlug: string | undefined =
    brandFlagIdx !== -1 ? args[brandFlagIdx + 1] : undefined;
  const slug = rawSlug ?? 'default';

  const dir = brandDir(slug);
  const ctx: FactoryContext = {
    slug,
    brandDir: dir,
    logoPath: path.join(dir, 'logo.svg'),
    log: (msg: string) => process.stdout.write(`  ${msg}\n`),
  };

  contrastStep(ctx)
    .then((result) => {
      if (result.warnings.length > 0) {
        process.stdout.write('\n  Warnings:\n');
        for (const w of result.warnings) {
          process.stdout.write(`  ⚠️  ${w}\n`);
        }
      }
      if (!result.ok) {
        process.stderr.write(`\n❌  contrast step failed for "${slug}"\n`);
        process.exit(1);
      }
      process.stdout.write(`\n✅  contrast step complete for "${slug}"\n`);
      for (const p of result.wrote) {
        process.stdout.write(`    wrote  ${path.relative(REPO_ROOT, p)}\n`);
      }
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`\nFatal: ${msg}\n`);
      process.exit(1);
    });
}
