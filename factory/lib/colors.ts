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

// ── WCAG contrast ─────────────────────────────────────────────────────────

/**
 * WCAG 2.1 contrast ratio between two hex colors.
 * Returns a value in [1, 21]; AA normal text requires ≥ 4.5.
 */
export function contrastRatio(fg: string, bg: string): number {
  const L1 = Math.max(relativeLuminance(fg), relativeLuminance(bg));
  const L2 = Math.min(relativeLuminance(fg), relativeLuminance(bg));
  return (L1 + 0.05) / (L2 + 0.05);
}

// ── HSL conversion helpers (internal) ─────────────────────────────────────

// H: 0–360, S: 0–100, L: 0–100
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const r1 = r / 255, g1 = g / 255, b1 = b / 255;
  const max = Math.max(r1, g1, b1);
  const min = Math.min(r1, g1, b1);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r1)      h = ((g1 - b1) / d + (g1 < b1 ? 6 : 0)) / 6;
  else if (max === g1) h = ((b1 - r1) / d + 2) / 6;
  else                 h = ((r1 - g1) / d + 4) / 6;

  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const h1 = h / 360, s1 = s / 100, l1 = l / 100;

  if (s1 === 0) {
    const v = Math.round(l1 * 255);
    return [v, v, v];
  }

  const q = l1 < 0.5 ? l1 * (1 + s1) : l1 + s1 - l1 * s1;
  const p = 2 * l1 - q;

  function hue2rgb(pp: number, qq: number, t: number): number {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return pp + (qq - pp) * 6 * tt;
    if (tt < 1 / 2) return qq;
    if (tt < 2 / 3) return pp + (qq - pp) * (2 / 3 - tt) * 6;
    return pp;
  }

  return [
    Math.round(hue2rgb(p, q, h1 + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h1)         * 255),
    Math.round(hue2rgb(p, q, h1 - 1 / 3) * 255),
  ];
}

// ── Contrast auto-adjust ───────────────────────────────────────────────────

export interface AdjustResult {
  hex: string;
  ratio: number;
}

/**
 * Nudge `fg`'s HSL lightness until `contrastRatio(fg, bg) >= target`.
 *
 * Algorithm:
 *   1. Convert fg to HSL, preserving hue and saturation (brand identity).
 *   2. Determine direction: if bg is lighter than fg we darken fg (step L down);
 *      otherwise we lighten fg (step L up).  This always moves fg away from bg.
 *   3. Step by 1 % per iteration (≤ 100 iterations, deterministic).
 *   4. Return the first hex that hits the target, or the boundary value if the
 *      target cannot be reached (rare; signals an incompatible palette).
 *
 * Never modifies the background color — only the foreground role.
 */
export function adjustForContrast(fg: string, bg: string, target: number): AdjustResult {
  const currentRatio = contrastRatio(fg, bg);
  if (currentRatio >= target) return { hex: fg, ratio: currentRatio };

  const [r, g, b] = hexToRgb(fg);
  const [h, s, l] = rgbToHsl(r, g, b);

  // Direction: move fg away from bg's luminance.
  // bg lighter → darken fg (step down); bg darker → lighten fg (step up).
  const step = relativeLuminance(bg) > relativeLuminance(fg) ? -1 : 1;

  let currentL = l;

  for (let i = 0; i < 100; i++) {
    const nextL = currentL + step;
    // Clamp and detect boundary
    currentL = step < 0 ? Math.max(0, nextL) : Math.min(100, nextL);

    const [nr, ng, nb] = hslToRgb(h, s, currentL);
    const candidate = rgbToHex(nr, ng, nb);
    const ratio = contrastRatio(candidate, bg);

    if (ratio >= target) return { hex: candidate, ratio };

    // Can't go further — return best effort
    if (currentL === 0 || currentL === 100) return { hex: candidate, ratio };
  }

  // Fallback (unreachable in practice — loop covers the full 0–100 range)
  const [nr, ng, nb] = hslToRgb(h, s, currentL);
  const candidate = rgbToHex(nr, ng, nb);
  return { hex: candidate, ratio: contrastRatio(candidate, bg) };
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
