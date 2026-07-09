// Phase 7 — AI palette extraction.
// Rasterises the brand logo, asks the vision model for 7 seed colors,
// cross-checks against dominant pixel clusters, and writes brand.draft.json.
// Does NOT overwrite brand.json — that happens after Phase 8 (contrast fix).

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { z } from 'zod';
import sharp from 'sharp';
import { BrandSchema } from '../../src/brand/schema';
import {
  assertInsideBrandDir,
  brandDir,
  REPO_ROOT,
  type FactoryContext,
  type FactoryStep,
  type StepResult,
} from '../lib/paths';
import { structuredOutput, type UserContentBlock } from '../lib/llm';
import { dominantColors, nearestCluster, colorDistance } from '../lib/colors';

// ── Constants ──────────────────────────────────────────────────────────────

/**
 * Maximum Euclidean RGB distance (0–441) from any dominant cluster before
 * a model-chosen color is replaced with the nearest cluster.
 *
 * Applied only to primary/secondary/accent (logo-derived colors).
 * background/surface/onSurface/onPrimary are UI-role colors and are not
 * cluster-checked; the model chooses them from design context, not pixels.
 *
 * At threshold 80 (~18 % of max distance) a colour must deviate clearly
 * from every pixel cluster in the logo to be overridden.
 */
const CLUSTER_OVERRIDE_THRESHOLD = 80;

/** Number of dominant colour clusters to extract from the rasterised logo. */
const DOMINANT_K = 8;

// ── Color schema (reuses BrandSchema's nested shape) ──────────────────────

const ColorsSchema = BrandSchema.shape.colors;
type Colors = z.infer<typeof ColorsSchema>;

// ── Helpers ────────────────────────────────────────────────────────────────

function slugToDisplayName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ── System + user prompts ──────────────────────────────────────────────────

const SYSTEM_PROMPT = `\
You are a brand color extraction expert for a white-label mobile rewards app.
Analyse the provided logo image and return exactly 7 hex seed colors that give
the app a cohesive identity rooted in this logo's visual character.

Color roles:
  primary      – the dominant brand color from the logo
  onPrimary    – text/icon color placed ON primary surfaces (must contrast well)
  secondary    – a supporting brand color, harmonious with primary
  accent       – a highlight / call-to-action color, distinct from primary
  background   – the main app background (light or dark, matching brand mood)
  surface      – card / component background, subtly different from background
  onSurface    – the main text color placed ON surface/background

Return a JSON object with exactly these seven keys and 6-digit hex values.
Example shape (replace values):
{"primary":"#RRGGBB","onPrimary":"#RRGGBB","secondary":"#RRGGBB",
 "accent":"#RRGGBB","background":"#RRGGBB","surface":"#RRGGBB","onSurface":"#RRGGBB"}`;

const USER_TEXT =
  'Extract 7 seed colors for a rewards app built around this brand logo. ' +
  'The palette must feel authentic to the logo\'s visual identity and work ' +
  'well for a polished mobile UI (good contrast, not garish).';

// ── FactoryStep ────────────────────────────────────────────────────────────

export const paletteStep: FactoryStep = async (
  ctx: FactoryContext,
): Promise<StepResult> => {
  const wrote: string[] = [];
  const warnings: string[] = [];

  // ── 1. Resolve logo path ──────────────────────────────────────────────────
  const brandJsonPath = path.join(ctx.brandDir, 'brand.json');
  const existingBrand = fs.existsSync(brandJsonPath)
    ? BrandSchema.parse(JSON.parse(fs.readFileSync(brandJsonPath, 'utf-8')))
    : null;

  const logoFilename = existingBrand?.logo ?? 'logo.svg';
  const svgPath = path.join(ctx.brandDir, logoFilename);
  if (!fs.existsSync(svgPath)) {
    return {
      ok: false,
      wrote,
      warnings: [`Logo not found: ${svgPath}`],
    };
  }

  // ── 2. Rasterise SVG → temp PNG (white bg, 512×512, density 300) ─────────
  //    Used for BOTH dominantColors and the vision call.
  const tmpPng = path.join(os.tmpdir(), `rnbf-palette-${ctx.slug}.png`);
  ctx.log('Rasterising logo…');
  await sharp(svgPath, { density: 300 })
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 255 },
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toFile(tmpPng);

  // ── 3. Extract dominant pixel clusters ───────────────────────────────────
  ctx.log(`Extracting ${DOMINANT_K} dominant colour clusters…`);
  const clusters = await dominantColors(tmpPng, DOMINANT_K);
  ctx.log(
    `  clusters: ${clusters.map((c) => `${c.hex}(${(c.weight * 100).toFixed(0)}%)`).join(', ')}`,
  );

  // ── 4. Vision call → 7 seed colors ───────────────────────────────────────
  ctx.log('Calling vision model for palette…');
  const imgData = fs.readFileSync(tmpPng).toString('base64');
  const userContent: UserContentBlock[] = [
    {
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: imgData },
    },
    { type: 'text', text: USER_TEXT },
  ];

  const rawColors: Colors = await structuredOutput(
    ColorsSchema,
    SYSTEM_PROMPT,
    userContent,
  );

  // ── 5. Clean up temp PNG ──────────────────────────────────────────────────
  try {
    fs.unlinkSync(tmpPng);
  } catch {
    // Non-fatal — temp file cleanup best-effort
  }

  // ── 6. Cross-check primary / secondary / accent against pixel clusters ────
  //    UI-role colors (background, surface, onSurface, onPrimary) are kept
  //    from the model — it reasons about contrast and mood, not pixels.
  const colors = { ...rawColors };
  const logoColors = ['primary', 'secondary', 'accent'] as const;

  for (const key of logoColors) {
    const modelHex = colors[key];
    const nearest = nearestCluster(modelHex, clusters);
    if (nearest.distance > CLUSTER_OVERRIDE_THRESHOLD) {
      warnings.push(
        `${key}: model returned ${modelHex} (nearest cluster ${nearest.hex}, ` +
          `RGB distance ${nearest.distance.toFixed(0)} > threshold ${CLUSTER_OVERRIDE_THRESHOLD}); ` +
          `overriding with ${nearest.hex}`,
      );
      colors[key] = nearest.hex;
    }
  }

  // ── 7. Sanity check: background and onSurface must not be near-equal ──────
  //    (If they're the same colour, text becomes invisible. Phase 8 will fix
  //    contrast formally; this is an early-warning only.)
  const bgOnSurfaceDist = colorDistance(colors.background, colors.onSurface);
  if (bgOnSurfaceDist < 40) {
    warnings.push(
      `background (${colors.background}) and onSurface (${colors.onSurface}) are ` +
        `very similar (RGB distance ${bgOnSurfaceDist.toFixed(0)}); text will be ` +
        `unreadable — Phase 8 will correct contrast`,
    );
  }

  // ── 8. Build draft — passthrough identity fields from existing brand.json ─
  const draft = {
    displayName: existingBrand?.displayName ?? slugToDisplayName(ctx.slug),
    slug: ctx.slug,
    bundleId:
      existingBrand?.bundleId ??
      `com.rnbrandfactory.${ctx.slug.replace(/-/g, '')}`,
    tagline: existingBrand?.tagline ?? 'Rewards that matter.',
    locales: existingBrand?.locales ?? ['en', 'de'],
    logo: existingBrand?.logo ?? 'logo.svg',
    colors,
  };

  // ── 9. Write brand.draft.json (never brand.json) ──────────────────────────
  const draftPath = path.join(ctx.brandDir, 'brand.draft.json');
  assertInsideBrandDir(ctx.slug, draftPath);
  fs.writeFileSync(draftPath, JSON.stringify(draft, null, 2) + '\n', 'utf-8');
  wrote.push(draftPath);

  ctx.log(`Wrote ${path.relative(REPO_ROOT, draftPath)}`);
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

  paletteStep(ctx)
    .then((result) => {
      if (result.warnings.length > 0) {
        process.stdout.write('\n  Warnings:\n');
        for (const w of result.warnings) {
          process.stdout.write(`  ⚠️  ${w}\n`);
        }
      }
      if (!result.ok) {
        process.stderr.write(`\n❌  palette step failed for "${slug}"\n`);
        process.exit(1);
      }
      process.stdout.write(`\n✅  palette step complete for "${slug}"\n`);
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
