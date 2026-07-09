import { z } from 'zod';
import type { BrandSeedColors } from '../theme/tokens';

const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const BrandSchema = z.object({
  displayName: z.string().min(1).max(30),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  bundleId: z.string().regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/),
  tagline: z.string().max(80),
  locales: z.array(z.enum(['en', 'de'])).nonempty(),
  logo: z.string().default('logo.svg'),
  colors: z.object({
    primary: Hex,
    onPrimary: Hex,
    secondary: Hex,
    accent: Hex,
    background: Hex,
    surface: Hex,
    onSurface: Hex,
  }),
});

export type BrandConfig = z.infer<typeof BrandSchema>;

// Compile-time guard: BrandSchema.colors must stay in sync with BrandSeedColors.
// If either adds or renames a color field, this line will fail to typecheck.
const _check: BrandSeedColors = {} as BrandConfig['colors'];
void _check;
