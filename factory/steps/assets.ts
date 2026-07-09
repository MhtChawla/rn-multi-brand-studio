// Asset generator: logo.svg → icon.png, adaptive-icon.png, adaptive-icon-bg.png,
// splash.png, favicon.png. Colors are read from brand.json — zero color literals here.
//
// adaptive-icon-bg.png uses brand.colors.background (not primary) so the Android
// adaptive icon matches the splash and icon background for visual consistency.

import * as fs from 'fs';
import * as path from 'path';
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Rgba {
  r: number;
  g: number;
  b: number;
  alpha: number;
}

function hexToRgba(hex: string, alpha = 255): Rgba {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, alpha };
}

// Rasterize SVG to a transparent PNG buffer at the given pixel dimensions.
// density:300 ensures clean upscaling from a 512px viewBox without blurriness.
async function rasterizeSvg(svgPath: string, width: number, height: number): Promise<Buffer> {
  const result = await sharp(svgPath, { density: 300 })
    .resize(width, height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();
  return result;
}

// Composite a pre-rasterized logo buffer, centred, onto a solid-colour background.
async function compositeOnBackground(
  logoBuffer: Buffer,
  canvasW: number,
  canvasH: number,
  bg: Rgba,
  outPath: string,
): Promise<void> {
  await sharp({
    create: { width: canvasW, height: canvasH, channels: 4, background: bg },
  })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

// ---------------------------------------------------------------------------
// FactoryStep implementation
// ---------------------------------------------------------------------------

export const assetsStep: FactoryStep = async (ctx: FactoryContext): Promise<StepResult> => {
  const wrote: string[] = [];
  const warnings: string[] = [];

  // Parse brand.json — the only authoritative source of colors.
  const brandJsonPath = path.join(ctx.brandDir, 'brand.json');
  const brand = BrandSchema.parse(
    JSON.parse(fs.readFileSync(brandJsonPath, 'utf-8')),
  );

  const svgPath = path.join(ctx.brandDir, brand.logo);
  if (!fs.existsSync(svgPath)) {
    return { ok: false, wrote, warnings: [`Logo file not found: ${svgPath}`] };
  }

  // Ensure assets/ exists inside the brand dir.
  const assetsDir = path.join(ctx.brandDir, 'assets');
  assertInsideBrandDir(ctx.slug, assetsDir);
  fs.mkdirSync(assetsDir, { recursive: true });

  const bg = hexToRgba(brand.colors.background);

  // ── icon.png — 1024×1024, logo padded to 70% (15% each side) ──────────────
  {
    const logoSize = Math.round(1024 * 0.70);
    const logo = await rasterizeSvg(svgPath, logoSize, logoSize);
    const outPath = path.join(assetsDir, 'icon.png');
    assertInsideBrandDir(ctx.slug, outPath);
    ctx.log('Generating icon.png…');
    await compositeOnBackground(logo, 1024, 1024, bg, outPath);
    wrote.push(outPath);
  }

  // ── adaptive-icon.png — 1024×1024, transparent bg, logo within 66% safe zone ─
  {
    const logoSize = Math.round(1024 * 0.66);
    const logo = await rasterizeSvg(svgPath, logoSize, logoSize);
    const outPath = path.join(assetsDir, 'adaptive-icon.png');
    assertInsideBrandDir(ctx.slug, outPath);
    ctx.log('Generating adaptive-icon.png…');
    await sharp({
      create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: logo, gravity: 'center' }])
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    wrote.push(outPath);
  }

  // ── adaptive-icon-bg.png — 1024×1024, solid brand.colors.background ────────
  {
    const outPath = path.join(assetsDir, 'adaptive-icon-bg.png');
    assertInsideBrandDir(ctx.slug, outPath);
    ctx.log('Generating adaptive-icon-bg.png…');
    await sharp({
      create: { width: 1024, height: 1024, channels: 4, background: bg },
    })
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    wrote.push(outPath);
  }

  // ── splash.png — 1284×2778, logo ~35% of width, centred ─────────────────
  {
    const logoSize = Math.round(1284 * 0.35);
    const logo = await rasterizeSvg(svgPath, logoSize, logoSize);
    const outPath = path.join(assetsDir, 'splash.png');
    assertInsideBrandDir(ctx.slug, outPath);
    ctx.log('Generating splash.png…');
    await compositeOnBackground(logo, 1284, 2778, bg, outPath);
    wrote.push(outPath);
  }

  // ── favicon.png — 48×48, logo padded to 70% ──────────────────────────────
  {
    const logoSize = Math.round(48 * 0.70);
    const logo = await rasterizeSvg(svgPath, logoSize, logoSize);
    const outPath = path.join(assetsDir, 'favicon.png');
    assertInsideBrandDir(ctx.slug, outPath);
    ctx.log('Generating favicon.png…');
    await compositeOnBackground(logo, 48, 48, bg, outPath);
    wrote.push(outPath);
  }

  return { ok: true, wrote, warnings };
};

// ---------------------------------------------------------------------------
// Standalone runner:  tsx factory/steps/assets.ts [--brand <slug>]
// ---------------------------------------------------------------------------

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

  assetsStep(ctx)
    .then((result) => {
      if (result.warnings.length > 0) {
        for (const w of result.warnings) {
          process.stderr.write(`  ⚠️  ${w}\n`);
        }
      }
      if (!result.ok) {
        process.stderr.write(`\n❌  assets step failed for "${slug}"\n`);
        process.exit(1);
      }
      process.stdout.write(`\n✅  assets step complete for "${slug}"\n`);
      for (const p of result.wrote) {
        process.stdout.write(`    wrote  ${path.relative(REPO_ROOT, p)}\n`);
      }
    })
    .catch((err: unknown) => {
      process.stderr.write(`Fatal: ${String(err)}\n`);
      process.exit(1);
    });
}
