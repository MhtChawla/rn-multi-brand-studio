import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import { Text } from '@/src/components/ui/Text';

interface PointsBalanceProps {
  points: number;
  testID?: string;
}

export function PointsBalance({ points, testID }: PointsBalanceProps) {
  const t = useTheme();
  const formatted = points.toLocaleString('en-US');

  return (
    <View testID={testID} style={{ alignItems: 'center', gap: t.spacing.xs }}>
      <Text variant="display" color={t.colors.primary}>
        {formatted}
      </Text>
      <Text variant="label" color={t.colors.onSurfaceMuted}>
        POINTS BALANCE
      </Text>
    </View>
  );
}
