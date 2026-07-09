import * as fs from 'fs';
import * as path from 'path';
import { BrandSchema } from '../src/brand/schema';

const ROOT = path.resolve(__dirname, '..');
const BRANDS_DIR = path.join(ROOT, 'brands');

function checkBrand(slug: string): { ok: boolean; errors: string[] } {
  const brandDir = path.join(BRANDS_DIR, slug);
  const brandJsonPath = path.join(brandDir, 'brand.json');
  const errors: string[] = [];

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(brandJsonPath, 'utf-8'));
  } catch {
    errors.push(`Cannot read brand.json`);
    return { ok: false, errors };
  }

  const result = BrandSchema.safeParse(raw);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`Schema: ${issue.path.join('.')} — ${issue.message}`);
    }
    return { ok: false, errors };
  }

  const config = result.data;

  if (config.slug !== slug) {
    errors.push(`slug "${config.slug}" does not match folder name "${slug}"`);
  }

  const logoPath = path.join(brandDir, config.logo);
  if (!fs.existsSync(logoPath)) {
    errors.push(`Logo file not found: ${config.logo}`);
  }

  return { ok: errors.length === 0, errors };
}

function main() {
  if (!fs.existsSync(BRANDS_DIR)) {
    console.error('brands/ directory not found');
    process.exit(1);
  }

  const slugs = fs
    .readdirSync(BRANDS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  if (slugs.length === 0) {
    console.error('No brand folders found in brands/');
    process.exit(1);
  }

  let anyFailed = false;

  for (const slug of slugs) {
    const { ok, errors } = checkBrand(slug);
    if (ok) {
      console.log(`  ✓  ${slug}`);
    } else {
      anyFailed = true;
      console.log(`  ✗  ${slug}`);
      for (const err of errors) {
        console.log(`       ${err}`);
      }
    }
  }

  if (anyFailed) {
    process.exit(1);
  }
}

main();
