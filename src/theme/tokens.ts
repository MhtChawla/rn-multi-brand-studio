import { Inter, typeScale, type TypeVariant } from './typography';

export interface BrandSeedColors {
  primary: string;
  onPrimary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  onSurface: string;
}

export interface Theme {
  colors: {
    primary: string;
    onPrimary: string;
    onPrimaryMuted: string;
    primaryMuted: string;
    qrWell: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceElevated: string;
    onSurface: string;
    onSurfaceMuted: string;
    border: string;
    success: string;
    successMuted: string;
    error: string;
    errorMuted: string;
  };
  spacing: { xs: 4; sm: 8; md: 12; lg: 16; xl: 24; xxl: 32; xxxl: 48 };
  radius: { sm: 8; md: 12; lg: 20; full: 999 };
  typography: {
    family: { regular: string; medium: string; bold: string };
    variant: Record<
      'display' | 'title' | 'heading' | 'body' | 'caption' | 'label',
      TypeVariant
    >;
  };
  elevation: {
    card: object;
    raised: object;
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

function mix(hex1: string, hex2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export const DEFAULT_SEED: BrandSeedColors = {
  primary: '#6366F1',
  onPrimary: '#FFFFFF',
  secondary: '#8B5CF6',
  accent: '#06B6D4',
  background: '#0B0C1E',
  surface: '#161729',
  onSurface: '#E2E8F0',
};

const SUCCESS = '#22C55E';
const ERROR = '#EF4444';

export function buildTheme(seed: BrandSeedColors): Theme {
  return {
    colors: {
      primary: seed.primary,
      onPrimary: seed.onPrimary,
      onPrimaryMuted: mix(seed.onPrimary, seed.primary, 0.35),
      primaryMuted: mix(seed.primary, seed.surface, 0.7),
      qrWell: mix(seed.onPrimary, seed.primary, 0.05),
      secondary: seed.secondary,
      accent: seed.accent,
      background: seed.background,
      surface: seed.surface,
      surfaceElevated: mix(seed.surface, '#ffffff', 0.08),
      onSurface: seed.onSurface,
      onSurfaceMuted: mix(seed.onSurface, seed.surface, 0.55),
      border: mix(seed.onSurface, seed.surface, 0.82),
      success: SUCCESS,
      successMuted: mix(SUCCESS, seed.surface, 0.75),
      error: ERROR,
      errorMuted: mix(ERROR, seed.surface, 0.8),
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
    radius: { sm: 8, md: 12, lg: 20, full: 999 },
    typography: {
      family: {
        regular: Inter.regular,
        medium: Inter.medium,
        bold: Inter.bold,
      },
      variant: typeScale,
    },
    elevation: {
      card: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
      },
      raised: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 6,
      },
    },
  };
}
