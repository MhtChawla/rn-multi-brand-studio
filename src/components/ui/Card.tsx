import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';

interface CardProps {
  children: React.ReactNode;
  elevated?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function Card({ children, elevated = false, style, testID }: CardProps) {
  const t = useTheme();

  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.lg,
          padding: t.spacing.lg,
          ...(elevated ? t.elevation.raised : t.elevation.card),
        } as ViewStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}
