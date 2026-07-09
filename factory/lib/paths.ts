import * as fs from 'fs';
import * as path from 'path';
import type { BrandConfig } from '../../src/brand/schema';

// Two directories up: factory/lib/ → factory/ → repo root
export const REPO_ROOT: string = path.resolve(__dirname, '../..');

export function brandDir(slug: string): string {
  const dir = path.join(REPO_ROOT, 'brands', slug);
  if (!fs.existsSync(dir)) {
    throw new Error(`Brand directory not found: brands/${slug}`);
  }
  return dir;
}

export function assertInsideBrandDir(slug: string, targetPath: string): void {
  const base = path.resolve(REPO_ROOT, 'brands', slug);
  const resolved = path.resolve(targetPath);
  // Allow the base itself or anything strictly inside it
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error(
      `Security violation: "${resolved}" is outside brands/${slug} ("${base}")`
    );
  }
}

export interface FactoryContext {
  slug: string;
  brandDir: string;
  brand?: BrandConfig;
  logoPath: string;
  log: (msg: string) => void;
}

export interface StepResult {
  ok: boolean;
  wrote: string[];
  warnings: string[];
}

export type FactoryStep = (ctx: FactoryContext) => Promise<StepResult>;
