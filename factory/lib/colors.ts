// Deterministic color utilities — no LLM, no randomness.

import sharp from 'sharp';

// ── Hex ↔ RGB ──────────────────────────────────────────────────────────────

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

// ── Luminance ──────────────────────────────────────────────────────────────

function linearise(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

// ── Color distance ─────────────────────────────────────────────────────────

/**
 * Euclidean distance in RGB space (range 0–441).
 *
 * This is NOT a perceptually-uniform metric (CIE ΔE would be, but requires
 * Lab conversion). For cluster-proximity checks — "does this hex come from
 * the logo or was it hallucinated?" — simple RGB distance is sufficient and
 * deterministic. Phase 8 handles perceptual contrast formally.
 */
export function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// ── Dominant-color extraction ──────────────────────────────────────────────

export interface ColorCluster {
  hex: string;
  /** Fraction of sampled pixels belonging to this bucket (0–1). */
  weight: number;
}

/**
 * Downsample `pngPath` to 48×48, quantise each channel to 8-unit buckets
 * (giving 32 levels per channel), and return the top-k most-frequent buckets.
 *
 * Transparent pixels are composited onto white before sampling so that SVG
 * logos with transparent backgrounds don't pollute the clusters with alpha
 * artefacts.
 */
export async function dominantColors(
  pngPath: string,
  k: number,
): Promise<ColorCluster[]> {
  const SAMPLE = 48;

  const { data, info } = await sharp(pngPath)
    .resize(SAMPLE, SAMPLE, { fit: 'cover' })
    .flatten({ background: { r: 255, g: 255, b: 255 } }) // composite alpha → white
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map<string, number>();
  const pixelCount = info.width * info.height;

  for (let i = 0; i < data.length; i += 3) {
    // Buffer indexing is always defined within [0, length); safe without `!`.
    const r = Math.round(data.readUInt8(i) / 8) * 8;
    const g = Math.round(data.readUInt8(i + 1) / 8) * 8;
    const b = Math.round(data.readUInt8(i + 2) / 8) * 8;
    const key = rgbToHex(r, g, b);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, k)
    .map(([hex, count]) => ({ hex, weight: count / pixelCount }));
}

// ── Nearest-cluster lookup ─────────────────────────────────────────────────

export interface NearestResult {
  hex: string;
  distance: number;
}

/**
 * Return the cluster whose hex is closest (Euclidean RGB) to `hex`.
 * Throws if `clusters` is empty.
 */
export function nearestCluster(
  hex: string,
  clusters: ColorCluster[],
): NearestResult {
  if (clusters.length === 0) throw new Error('nearestCluster: empty cluster list');

  let best: NearestResult = { hex: clusters[0]!.hex, distance: Infinity };
  for (const c of clusters) {
    const d = colorDistance(hex, c.hex);
    if (d < best.distance) best = { hex: c.hex, distance: d };
  }
  return best;
}
