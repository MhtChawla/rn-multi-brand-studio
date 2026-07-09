// Register sucrase so that require('./src/brand/schema') resolves the .ts file
// when @expo/config evaluates this config via require-from-string + CJS.
import 'sucrase/register';
import * as fs from 'fs';
import * as path from 'path';
import { BrandSchema } from './src/brand/schema';

const slug = process.env.BRAND ?? 'default';
const brandsDir = path.join(__dirname, 'brands');
const brandDir = path.join(brandsDir, slug);
const brandJsonPath = path.join(brandDir, 'brand.json');

function listAvailableBrands(): string {
  try {
    return fs
      .readdirSync(brandsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .join(', ');
  } catch {
    return '(could not read brands/ directory)';
  }
}

let rawJson: string;
try {
  rawJson = fs.readFileSync(brandJsonPath, 'utf-8');
} catch {
  throw new Error(
    `Brand "${slug}" not found: no file at ${brandJsonPath}. ` +
      `Available brands: [${listAvailableBrands()}]`,
  );
}

const parseResult = BrandSchema.safeParse(JSON.parse(rawJson));
if (!parseResult.success) {
  throw new Error(
    `Brand "${slug}" failed schema validation:\n${parseResult.error.message}\n` +
      `Available brands: [${listAvailableBrands()}]`,
  );
}

const brand = parseResult.data;

// iOS schemes must be alphanumeric; hyphens are disallowed.
// "default" is also avoided as a scheme since it conflicts with Apple's defaults.
const scheme =
  brand.slug === 'default' ? 'clubone' : brand.slug.replace(/-/g, '');

export default {
  name: brand.displayName,
  slug: 'rn-brand-factory',
  version: '1.0.0',
  orientation: 'portrait',
  icon: `./brands/${slug}/assets/icon.png`,
  scheme,
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: brand.bundleId,
  },
  android: {
    package: brand.bundleId,
    adaptiveIcon: {
      foregroundImage: `./brands/${slug}/assets/adaptive-icon.png`,
      backgroundColor: brand.colors.background,
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: `./brands/${slug}/assets/favicon.png`,
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: `./brands/${slug}/assets/splash.png`,
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: brand.colors.background,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    brand,
  },
};
