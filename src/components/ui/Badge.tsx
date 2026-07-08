import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import { Text } from './Text';

type BadgeVariant = 'primary' | 'success' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  testID?: string;
}

export function Badge({ label, variant = 'primary', testID }: BadgeProps) {
  const t = useTheme();

  const bgMap: Record<BadgeVariant, string> = {
    primary: t.colors.primaryMuted,
    success: t.colors.successMuted,
    error: t.colors.errorMuted,
    neutral: t.colors.surfaceElevated,
  };

  const textColorMap: Record<BadgeVariant, string> = {
    primary: t.colors.primary,
    success: t.colors.success,
    error: t.colors.error,
    neutral: t.colors.onSurfaceMuted,
  };

  return (
    <View
      testID={testID}
      style={{
        backgroundColor: bgMap[variant],
        borderRadius: t.radius.full,
        paddingHorizontal: t.spacing.sm,
        paddingVertical: t.spacing.xs,
        alignSelf: 'flex-start',
      }}
    >
      <Text variant="label" color={textColorMap[variant]}>
        {label}
      </Text>
    </View>
  );
}
