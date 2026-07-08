import type { TextStyle } from 'react-native';

export const Inter = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  bold: 'Inter_700Bold',
} as const;

export interface TypeVariant {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: TextStyle['textTransform'];
}

export const typeScale: Record<
  'display' | 'title' | 'heading' | 'body' | 'caption' | 'label',
  TypeVariant
> = {
  display: { fontFamily: Inter.bold, fontSize: 52, lineHeight: 56, letterSpacing: -1 },
  title:   { fontFamily: Inter.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  heading: { fontFamily: Inter.medium, fontSize: 17, lineHeight: 22 },
  body:    { fontFamily: Inter.regular, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: Inter.regular, fontSize: 13, lineHeight: 18 },
  label:   {
    fontFamily: Inter.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
};

export type TypographyVariant = keyof typeof typeScale;
