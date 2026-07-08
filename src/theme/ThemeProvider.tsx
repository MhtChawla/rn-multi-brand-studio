import React, { createContext, useMemo } from 'react';
import { buildTheme, DEFAULT_SEED, type BrandSeedColors, type Theme } from './tokens';

export const ThemeContext = createContext<Theme | null>(null);

interface ThemeProviderProps {
  seed?: BrandSeedColors;
  children: React.ReactNode;
}

export function ThemeProvider({ seed, children }: ThemeProviderProps) {
  const theme = useMemo(() => buildTheme(seed ?? DEFAULT_SEED), [seed]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
