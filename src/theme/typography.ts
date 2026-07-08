export const Inter = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  bold: 'Inter_700Bold',
} as const;

export const typeScale = {
  display: { fontFamily: Inter.bold, fontSize: 36, lineHeight: 44 },
  title:   { fontFamily: Inter.bold, fontSize: 24, lineHeight: 32 },
  heading: { fontFamily: Inter.medium, fontSize: 20, lineHeight: 28 },
  body:    { fontFamily: Inter.regular, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: Inter.regular, fontSize: 12, lineHeight: 18 },
  label:   { fontFamily: Inter.medium, fontSize: 14, lineHeight: 20 },
} as const;

export type TypographyVariant = keyof typeof typeScale;
