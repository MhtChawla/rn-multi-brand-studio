// Device frame compositing utility.
// Generates a minimalist phone frame overlay via SVG, composites the Maestro
// raw screenshot inside the screen area, and adds a bilingual caption bar.

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

// ── Frame geometry ──────────────────────────────────────────────────────────

interface FrameConfig {
  outerW: number;
  outerH: number;
  radius: number;
  screenX: number;
  screenY: number;
  screenW: number;
  screenH: number;
  // Pixel 7: punch-hole camera
  camera?: { cx: number; cy: number; r: number };
  // iPhone 15: Dynamic Island pill
  dynamicIsland?: { cx: number; cy: number; rw: number; rh: number };
}

const PIXEL7: FrameConfig = {
  outerW: 600,
  outerH: 1228,
  radius: 46,
  screenX: 20,
  screenY: 70,
  screenW: 560,
  screenH: 1100,
  camera: { cx: 300, cy: 36, r: 11 },
};

const IPHONE15: FrameConfig = {
  outerW: 600,
  outerH: 1248,
  radius: 54,
  screenX: 16,
  screenY: 58,
  screenW: 568,
  screenH: 1122,
  dynamicIsland: { cx: 300, cy: 34, rw: 65, rh: 17 },
};

const CONFIGS: Record<'pixel7' | 'iphone15', FrameConfig> = {
  pixel7: PIXEL7,
  iphone15: IPHONE15,
};

// ── SVG helpers ─────────────────────────────────────────────────────────────

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Rounded-rectangle SVG path (clockwise). */
function rrectPath(x: number, y: number, w: number, h: number, r: number): string {
  return (
    `M ${x + r},${y} ` +
    `H ${x + w - r} A ${r},${r} 0 0,1 ${x + w},${y + r} ` +
    `V ${y + h - r} A ${r},${r} 0 0,1 ${x + w - r},${y + h} ` +
    `H ${x + r} A ${r},${r} 0 0,1 ${x},${y + h - r} ` +
    `V ${y + r} A ${r},${r} 0 0,1 ${x + r},${y} Z`
  );
}

/**
 * Build the phone-shell SVG: opaque phone body with a transparent screen hole.
 * Uses even-odd fill rule — outer path + inner rect cancel out to create the
 * cut-out so the screenshot underneath shows through.
 */
function buildFrameSvg(cfg: FrameConfig): string {
  const { outerW, outerH, radius, screenX, screenY, screenW, screenH } = cfg;

  const outerPath = rrectPath(0, 0, outerW, outerH, radius);
  // Screen hole (counter-clockwise so even-odd rule creates the hole)
  const holePath =
    `M ${screenX},${screenY} ` +
    `H ${screenX + screenW} ` +
    `V ${screenY + screenH} ` +
    `H ${screenX} Z`;

  // Side buttons (Pixel 7 style)
  const buttons = `
    <rect x="${outerW - 3}" y="240" width="4" height="80" rx="2" fill="#141414"/>
    <rect x="-1"            y="195" width="4" height="50" rx="2" fill="#141414"/>
    <rect x="-1"            y="265" width="4" height="70" rx="2" fill="#141414"/>`;

  let cutout = '';
  if (cfg.camera) {
    const { cx, cy, r } = cfg.camera;
    cutout = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0d0d0d"/>`;
  } else if (cfg.dynamicIsland) {
    const { cx, cy, rw, rh } = cfg.dynamicIsland;
    cutout = `<rect x="${cx - rw}" y="${cy - rh}" width="${rw * 2}" height="${rh * 2}" rx="${rh}" fill="#0d0d0d"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${outerW}" height="${outerH}">
  <path fill-rule="evenodd" fill="#1c1c1e" d="${outerPath} ${holePath}"/>
  ${buttons}
  ${cutout}
</svg>`;
}

/** Caption bar SVG — shows captionDE (left, primary) and captionEN (below, secondary). */
function buildCaptionSvg(
  w: number,
  h: number,
  captionDE: string,
  captionEN: string,
  displayName: string,
  slug: string,
  bgColor: string,
  textColor: string,
  mutedColor: string,
): string {
  const mid = Math.round(h * 0.42);
  const bot = Math.round(h * 0.74);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${bgColor}"/>
  <line x1="0" y1="0" x2="${w}" y2="0" stroke="${mutedColor}" stroke-width="0.5"/>
  <text x="16" y="${mid}" font-family="system-ui,-apple-system,sans-serif" font-size="16" font-weight="600" fill="${escapeXml(textColor)}">${escapeXml(captionDE)}</text>
  <text x="16" y="${bot}" font-family="system-ui,-apple-system,sans-serif" font-size="13" fill="${escapeXml(mutedColor)}">${escapeXml(captionEN)}</text>
  <text x="${w - 16}" y="${mid}" text-anchor="end" font-family="system-ui,-apple-system,sans-serif" font-size="14" font-weight="600" fill="${escapeXml(textColor)}">${escapeXml(displayName)}</text>
  <text x="${w - 16}" y="${bot}" text-anchor="end" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="${escapeXml(mutedColor)}">${escapeXml(slug)}</text>
</svg>`;
}

// ── Frame cache ─────────────────────────────────────────────────────────────

const FRAMES_DIR = path.join(__dirname, '..', 'assets', 'frames');

/** Returns a path to the cached frame PNG, generating it on first call. */
async function getFramePng(deviceType: 'pixel7' | 'iphone15'): Promise<string> {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  const cachePath = path.join(FRAMES_DIR, `device-${deviceType}.png`);
  if (!fs.existsSync(cachePath)) {
    const cfg = CONFIGS[deviceType];
    const svg = buildFrameSvg(cfg);
    // density: 72 gives 1:1 SVG px → output px; resize ensures exact dimensions.
    await sharp(Buffer.from(svg), { density: 72 })
      .resize(cfg.outerW, cfg.outerH, { fit: 'fill' })
      .png({ compressionLevel: 6 })
      .toFile(cachePath);
  }
  return cachePath;
}

// ── Caption height constant ─────────────────────────────────────────────────

const CAPTION_H = 80;

// ── Luminance for auto text colour ─────────────────────────────────────────

function hexLuminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const linearize = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize((n >> 16) & 255) +
         0.7152 * linearize((n >> 8)  & 255) +
         0.0722 * linearize( n        & 255);
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Composite a raw Maestro screenshot onto a device frame, add a bilingual
 * caption bar, and write the result to outputPath.
 *
 * Caption bar layout:
 *   Left  — captionDE (bold, primary) / captionEN (lighter, below)
 *   Right — displayName (bold) / slug (lighter, below)
 *
 * @param captionBg  Caption bar background hex (default: #f5f5f5)
 */
export async function frameScreenshot(
  inputPath: string,
  outputPath: string,
  deviceType: 'pixel7' | 'iphone15',
  _orientation: 'portrait' | 'landscape',
  captionDE: string,
  captionEN: string,
  displayName = '',
  slug = '',
  captionBg = '#f5f5f5',
): Promise<void> {
  const cfg = CONFIGS[deviceType];
  const { outerW, outerH, screenX, screenY, screenW, screenH } = cfg;

  // Pick text colours based on caption background luminance.
  const lum = hexLuminance(captionBg);
  const textColor  = lum > 0.4 ? '#1a1a1a' : '#f0f0f0';
  const mutedColor = lum > 0.4 ? '#6b7280' : '#9ca3af';

  // 1. Resize raw screenshot to exactly fit the screen well.
  const screenshotBuf = await sharp(inputPath)
    .resize(screenW, screenH, { fit: 'fill' })
    .png()
    .toBuffer();

  // 2. Load (or generate) the frame shell PNG.
  const framePath = await getFramePng(deviceType);
  const frameBuf = fs.readFileSync(framePath);

  // 3. Build caption SVG → PNG buffer.
  const captionSvg = buildCaptionSvg(
    outerW, CAPTION_H,
    captionDE, captionEN,
    displayName, slug,
    captionBg, textColor, mutedColor,
  );
  const captionBuf = await sharp(Buffer.from(captionSvg), { density: 72 })
    .resize(outerW, CAPTION_H, { fit: 'fill' })
    .png()
    .toBuffer();

  // 4. Composite: dark canvas → screenshot → frame overlay → caption bar.
  const totalH = outerH + CAPTION_H;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await sharp({
    create: { width: outerW, height: totalH, channels: 4, background: { r: 28, g: 28, b: 30, alpha: 255 } },
  })
    .composite([
      // Screenshot fills the screen well
      { input: screenshotBuf, top: screenY, left: screenX },
      // Frame shell overlaid (phone body opaque, screen area transparent)
      { input: frameBuf,      top: 0,       left: 0       },
      // Caption bar below the frame
      { input: captionBuf,    top: outerH,  left: 0       },
    ])
    .png({ compressionLevel: 6 })
    .toFile(outputPath);
}
