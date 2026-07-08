import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import type { Reward } from '@/src/data/types';

interface RewardCardProps {
  reward: Reward;
  testID?: string;
}

export function RewardCard({ reward, testID }: RewardCardProps) {
  const t = useTheme();

  return (
    <Card testID={testID ?? `reward-card-${reward.id}`} style={{ gap: t.spacing.sm }}>
      <Badge label={reward.category} variant="primary" />
      <Text variant="heading" numberOfLines={2}>
        {reward.title}
      </Text>
      <Text variant="caption" color={t.colors.onSurfaceMuted} numberOfLines={2}>
        {reward.description}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: t.spacing.xs,
        }}
      >
        <Text variant="label" color={t.colors.accent}>
          {reward.pointsCost.toLocaleString('en-US')} pts
        </Text>
        <Button
          label="Redeem"
          variant="primary"
          testID={`redeem-reward-${reward.id}`}
        />
      </View>
    </Card>
  );
}
