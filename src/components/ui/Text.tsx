import React from 'react';
import { Text as RNText, type TextStyle } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import type { TypographyVariant } from '@/src/theme/typography';

interface TextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  children?: React.ReactNode;
  testID?: string;
  style?: TextStyle;
  numberOfLines?: number;
}

export function Text({
  variant = 'body',
  color,
  align,
  children,
  testID,
  style,
  numberOfLines,
}: TextProps) {
  const t = useTheme();
  const variantStyle = t.typography.variant[variant];

  return (
    <RNText
      testID={testID}
      numberOfLines={numberOfLines}
      style={[
        variantStyle,
        { color: color ?? t.colors.onSurface },
        align ? { textAlign: align } : undefined,
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
