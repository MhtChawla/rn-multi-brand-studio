import Constants from 'expo-constants';
import { BrandSchema, type BrandConfig } from './schema';

let cached: BrandConfig | null = null;

export function loadBrand(): BrandConfig {
  if (cached !== null) return cached;

  const expoConfig = Constants.expoConfig;
  if (!expoConfig) {
    throw new Error(
      'loadBrand: Constants.expoConfig is null — the native manifest was not embedded. ' +
        'Run: BRAND=default npx expo start -c',
    );
  }

  const raw: unknown = expoConfig.extra?.['brand'];
  if (raw === undefined || raw === null) {
    throw new Error(
      'loadBrand: Constants.expoConfig.extra.brand is absent. ' +
        'The manifest does not include the brand config. ' +
        'Run: BRAND=default npx expo start -c to clear the cache and re-evaluate app.config.ts.',
    );
  }

  const result = BrandSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `loadBrand: brand config failed runtime validation:\n${result.error.message}`,
    );
  }

  cached = result.data;
  return cached;
}

export function loadLogoSvg(): string | null {
  const raw: unknown = Constants.expoConfig?.extra?.['logoSvg'];
  return typeof raw === 'string' ? raw : null;
}
