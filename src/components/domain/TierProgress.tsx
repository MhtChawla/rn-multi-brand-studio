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
  const remaining = Math.max(nextTierPoints - points, 0);

  return (
    <View testID={testID} style={{ gap: t.spacing.sm }}>
      <ProgressBar progress={progress} testID={testID ? `${testID}-bar` : undefined} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="caption" color={t.colors.onSurfaceMuted}>
          {TIER_LABEL[tier]} member
        </Text>
        <Text variant="caption" color={t.colors.onSurfaceMuted} tabular>
          {remaining.toLocaleString('en-US')} to next tier
        </Text>
      </View>
    </View>
  );
}
