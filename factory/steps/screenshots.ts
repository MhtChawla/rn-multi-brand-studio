// Phase 10 — Automated screenshot capture and device-frame compositing.
//
// Pre-flight (not automated here):
//   1. Android emulator (Pixel 7 API 34) or iOS Simulator (iPhone 15) running.
//   2. App built and installed for the target brand:
//        BRAND=<slug> npx expo run:android   (or run:ios)
//   3. maestro --version works (installed and in PATH).
//
// This step runs the five .maestro/flows/*.yaml files sequentially, finds the
// raw PNG that Maestro saved, frames it via factory/lib/frame.ts, and writes
// framed images to brands/<slug>/screenshots/{en,de}/.

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { BrandSchema } from '../../src/brand/schema';
import {
  assertInsideBrandDir,
  brandDir,
  REPO_ROOT,
  type FactoryContext,
  type FactoryStep,
  type StepResult,
} from '../lib/paths';
import { frameScreenshot } from '../lib/frame';

// ── Flow definitions ────────────────────────────────────────────────────────

const FLOWS = ['01-home', '02-rewards', '03-card', '04-activity', '05-profile'] as const;
type FlowId = typeof FLOWS[number];

// All screen captions — centralised here so one edit covers every brand.
const CAPTIONS: Record<FlowId, Record<'en' | 'de', string>> = {
  '01-home':     { en: 'Earn points for every purchase', de: 'Punkte sammeln bei jedem Einkauf' },
  '02-rewards':  { en: 'Redeem your rewards',            de: 'Prämien einlösen'                 },
  '03-card':     { en: 'Your membership card',           de: 'Ihre Mitgliedskarte'              },
  '04-activity': { en: 'Track your activity',            de: 'Aktivitäten verfolgen'            },
  '05-profile':  { en: 'Manage your profile',            de: 'Profil verwalten'                 },
};

// ── Maestro helpers ─────────────────────────────────────────────────────────

const FLOWS_DIR = path.join(REPO_ROOT, '.maestro', 'flows');
const MAESTRO_TESTS_DIR = path.join(os.homedir(), '.maestro', 'tests');

/** Resolve the `maestro` binary — supports standalone install under ~/.maestro/bin. */
function maestroBin(): string {
  const local = path.join(os.homedir(), '.maestro', 'bin', 'maestro');
  if (fs.existsSync(local)) return local;
  return 'maestro'; // hope it's in PATH
}

/**
 * Search ~/.maestro/tests/ for a PNG file created after `afterMs`.
 * Maestro saves `takeScreenshot` output there regardless of --output flag.
 */
function findMaestroScreenshot(name: string, afterMs: number): string | null {
  if (!fs.existsSync(MAESTRO_TESTS_DIR)) return null;

  const entries = fs.readdirSync(MAESTRO_TESTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({
      dir: path.join(MAESTRO_TESTS_DIR, e.name),
      mtime: fs.statSync(path.join(MAESTRO_TESTS_DIR, e.name)).mtimeMs,
    }))
    .filter((e) => e.mtime >= afterMs)
    .sort((a, b) => b.mtime - a.mtime); // newest first

  for (const { dir } of entries) {
    const candidate = path.join(dir, `${name}.png`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

// ── Emulator check ──────────────────────────────────────────────────────────

function detectEmulator(): { ok: boolean; device: string } {
  try {
    const out = execSync('adb devices', { stdio: 'pipe' }).toString();
    const lines = out.split('\n').filter((l) => l.includes('\t') && l.includes('device'));
    if (lines.length > 0) {
      return { ok: true, device: lines[0]?.split('\t')[0] ?? 'unknown' };
    }
  } catch {
    // adb not found or not in PATH — fall through to iOS check
  }
  // iOS simulator check
  try {
    const out = execSync('xcrun simctl list devices --json 2>/dev/null', { stdio: 'pipe' }).toString();
    const data: { devices: Record<string, { state: string; udid: string }[]> } = JSON.parse(out);
    const booted = Object.values(data.devices)
      .flat()
      .find((d) => d.state === 'Booted');
    if (booted) return { ok: true, device: booted.udid };
  } catch {
    // no iOS tools
  }
  return { ok: false, device: '' };
}

// ── FactoryStep ─────────────────────────────────────────────────────────────

export const screenshotsStep: FactoryStep = async (
  ctx: FactoryContext,
): Promise<StepResult> => {
  const wrote: string[] = [];
  const warnings: string[] = [];

  // 1. Verify brand.json
  const brandJsonPath = path.join(ctx.brandDir, 'brand.json');
  if (!fs.existsSync(brandJsonPath)) {
    return { ok: false, wrote, warnings: [`brand.json not found in brands/${ctx.slug}`] };
  }
  const brand = BrandSchema.parse(JSON.parse(fs.readFileSync(brandJsonPath, 'utf-8')));

  // 2. Verify emulator / simulator is running
  const emulator = detectEmulator();
  if (!emulator.ok) {
    return {
      ok: false,
      wrote,
      warnings: [
        'No running emulator/simulator detected. Start one and install the app first:\n' +
        `  BRAND=${ctx.slug} npx expo run:android   # Android\n` +
        `  BRAND=${ctx.slug} npx expo run:ios        # iOS`,
      ],
    };
  }
  ctx.log(`Emulator detected: ${emulator.device}`);

  // 3. Remind user to ensure the brand is installed (can't automate prebuild here).
  ctx.log(
    `Assuming BRAND=${ctx.slug} is installed on the emulator. ` +
    `If not, run: BRAND=${ctx.slug} npx expo run:android`,
  );

  // 4. Run each Maestro flow, collect raw screenshot paths
  const rawScreenshots: Partial<Record<FlowId, string>> = {};
  const bin = maestroBin();

  for (const flowId of FLOWS) {
    const flowFile = path.join(FLOWS_DIR, `${flowId}.yaml`);
    if (!fs.existsSync(flowFile)) {
      warnings.push(`Flow file not found, skipping: ${flowId}.yaml`);
      continue;
    }

    ctx.log(`Running flow ${flowId}…`);
    const startMs = Date.now();

    try {
      execSync(
        `"${bin}" test "${flowFile}" --appId "${brand.bundleId}"`,
        { stdio: 'pipe', timeout: 120_000 },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      warnings.push(`Flow ${flowId} exited with error (screenshot may still exist): ${msg.slice(0, 120)}`);
    }

    const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
    if (Number(elapsed) > 30) {
      warnings.push(`Flow ${flowId} took ${elapsed}s — consider reducing tap delays`);
    }

    // Find the screenshot in ~/.maestro/tests/ (Maestro 2.x default output)
    const rawPath = findMaestroScreenshot(flowId, startMs);
    if (rawPath) {
      ctx.log(`  found screenshot: ${path.relative(os.homedir(), rawPath)}`);
      rawScreenshots[flowId] = rawPath;
    } else {
      warnings.push(`Screenshot not found for flow ${flowId} — verify flow ran successfully`);
    }
  }

  if (Object.keys(rawScreenshots).length === 0) {
    return {
      ok: false,
      wrote,
      warnings: [...warnings, 'No screenshots captured. Verify emulator is running and app is installed.'],
    };
  }

  // 5. Frame and save — one per locale × flow
  const locales = (['en', 'de'] as const).filter((l) =>
    (brand.locales as string[]).includes(l),
  );

  for (const locale of locales) {
    for (const flowId of FLOWS) {
      const rawPath = rawScreenshots[flowId];
      if (!rawPath) continue;

      const localeDir = path.join(ctx.brandDir, 'screenshots', locale);
      assertInsideBrandDir(ctx.slug, localeDir);
      fs.mkdirSync(localeDir, { recursive: true });

      const outputPath = path.join(localeDir, `${flowId}.png`);
      assertInsideBrandDir(ctx.slug, outputPath);

      ctx.log(`Framing ${flowId} [${locale}]…`);
      await frameScreenshot(
        rawPath,
        outputPath,
        'pixel7',
        'portrait',
        CAPTIONS[flowId].de,
        CAPTIONS[flowId].en,
        brand.displayName,
        brand.slug,
        brand.colors.background,
      );
      wrote.push(outputPath);
    }
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

  screenshotsStep(ctx)
    .then((result) => {
      if (result.warnings.length > 0) {
        process.stdout.write('\n  Warnings:\n');
        for (const w of result.warnings) {
          process.stdout.write(`  ⚠️  ${w}\n`);
        }
      }
      if (!result.ok) {
        process.stderr.write(`\n❌  screenshots step failed for "${slug}"\n`);
        process.exit(1);
      }
      process.stdout.write(`\n✅  screenshots step complete for "${slug}"\n`);
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
