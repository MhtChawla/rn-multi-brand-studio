// Phase 9 — AI-generated store listing copy (DE/EN).
// Reads brand.json, calls the LLM once per locale, writes one .txt file per
// field into brands/<slug>/store/<locale>/. Idempotent: re-running overwrites.

import * as fs from 'fs';
import * as path from 'path';
import { BrandSchema } from '../../src/brand/schema';
import {
  assertInsideBrandDir,
  brandDir,
  REPO_ROOT,
  type FactoryContext,
  type FactoryStep,
  type StepResult,
} from '../lib/paths';
import { structuredOutput } from '../lib/llm';
import { StoreCopy, type StoreCopyType } from '../lib/store-copy.schema';

// ── Feature list (centralised here; one edit updates all brands) ───────────

const FEATURES = [
  'Earn points for purchases',
  'Tier progression',
  'Activity history',
  'Redeem rewards',
  'Membership card with QR code',
] as const;

// ── Token budget for store copy (descriptions can reach ~1 000 tokens) ─────
const STORE_COPY_MAX_TOKENS = 2048;

// ── Prompt template loader ──────────────────────────────────────────────────

const TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  'templates',
  'store-copy.prompt.md',
);

interface Prompts {
  system: string;
  user: string;
}

function renderTemplate(locale: 'en' | 'de', brand: {
  displayName: string;
  tagline: string;
}): Prompts {
  const raw = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  const SYSTEM_MARKER = '{{SYSTEM}}\n';
  const USER_MARKER = '\n{{USER}}\n';

  const systemStart = raw.indexOf(SYSTEM_MARKER);
  const userStart = raw.indexOf(USER_MARKER);

  if (systemStart === -1 || userStart === -1) {
    throw new Error(
      'store-copy.prompt.md is missing {{SYSTEM}} or {{USER}} markers',
    );
  }

  const rawSystem = raw.slice(systemStart + SYSTEM_MARKER.length, userStart).trim();
  const rawUser = raw.slice(userStart + USER_MARKER.length).trim();

  const vars: Record<string, string> = {
    locale,
    displayName: brand.displayName,
    tagline: brand.tagline,
    features: FEATURES.join(', '),
  };

  const fill = (template: string) =>
    template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);

  return { system: fill(rawSystem), user: fill(rawUser) };
}

// ── FactoryStep ─────────────────────────────────────────────────────────────

export const copyStep: FactoryStep = async (
  ctx: FactoryContext,
): Promise<StepResult> => {
  const wrote: string[] = [];
  const warnings: string[] = [];

  // 1. Load and validate brand.json
  const brandJsonPath = path.join(ctx.brandDir, 'brand.json');
  if (!fs.existsSync(brandJsonPath)) {
    return {
      ok: false,
      wrote,
      warnings: [`brand.json not found in brands/${ctx.slug}`],
    };
  }
  const brand = BrandSchema.parse(
    JSON.parse(fs.readFileSync(brandJsonPath, 'utf-8')),
  );

  // 2. Normalise locale order: en before de (consistent output ordering)
  const locales = (['en', 'de'] as const).filter((l) =>
    (brand.locales as string[]).includes(l),
  );

  for (const locale of locales) {
    ctx.log(`Generating ${locale.toUpperCase()} store copy…`);

    // 3. Render prompts from template
    const { system, user } = renderTemplate(locale, brand);

    // 4. LLM call — zod-validated, retried up to 3×
    const copy: StoreCopyType = await structuredOutput(
      StoreCopy,
      system,
      user,
      3,
      STORE_COPY_MAX_TOKENS,
    );

    // 5. Warn if any field is near its limit (>90 %)
    const limits: [keyof StoreCopyType, number][] = [
      ['title', 30],
      ['subtitle', 30],
      ['description', 4000],
      ['keywords', 100],
      ['releaseNotes', 500],
    ];
    for (const [field, max] of limits) {
      const len = copy[field].length;
      if (len > max * 0.9) {
        warnings.push(
          `${locale}/${field}: ${len}/${max} chars (>${Math.round(0.9 * max)} threshold)`,
        );
      }
    }

    // 6. Write one .txt per field
    const localeDir = path.join(ctx.brandDir, 'store', locale);
    assertInsideBrandDir(ctx.slug, localeDir);
    fs.mkdirSync(localeDir, { recursive: true });

    const fields = Object.keys(copy) as (keyof StoreCopyType)[];
    for (const field of fields) {
      const filePath = path.join(localeDir, `${field}.txt`);
      assertInsideBrandDir(ctx.slug, filePath);
      fs.writeFileSync(filePath, copy[field], 'utf-8');
      wrote.push(filePath);
    }

    ctx.log(
      `  ${locale}: title=${copy.title.length}c  desc=${copy.description.length}c  kw=${copy.keywords.length}c`,
    );
  }

  return { ok: true, wrote, warnings };
};

// ── Standalone runner ───────────────────────────────────────────────────────

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

  copyStep(ctx)
    .then((result) => {
      if (result.warnings.length > 0) {
        process.stdout.write('\n  Warnings:\n');
        for (const w of result.warnings) {
          process.stdout.write(`  ⚠️  ${w}\n`);
        }
      }
      if (!result.ok) {
        process.stderr.write(`\n❌  copy step failed for "${slug}"\n`);
        process.exit(1);
      }
      process.stdout.write(`\n✅  copy step complete for "${slug}"\n`);
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
