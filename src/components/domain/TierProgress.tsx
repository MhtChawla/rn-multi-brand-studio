import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import { Text } from '@/src/components/ui/Text';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import type { Tier } from '@/src/data/types';

const TIER_LABEL: Record<Tier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

interface TierProgressProps {
  points: number;
  nextTierPoints: number;
  tier: Tier;
  testID?: string;
}

export function TierProgress({ points, nextTierPoints, tier, testID }: TierProgressProps) {
  const t = useTheme();
  const progress = Math.min(points / nextTierPoints, 1);
  const formatted = points.toLocaleString('en-US');
  const nextFormatted = nextTierPoints.toLocaleString('en-US');

  return (
    <View testID={testID} style={{ gap: t.spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="label" color={t.colors.onSurfaceMuted}>
          {TIER_LABEL[tier]} Member
        </Text>
        <Text variant="caption" color={t.colors.onSurfaceMuted}>
          {formatted} / {nextFormatted} pts
        </Text>
      </View>
      <ProgressBar progress={progress} testID={testID ? `${testID}-bar` : undefined} />
    </View>
  );
}
