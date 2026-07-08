import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import { Badge } from '@/src/components/ui/Badge';
import { Text } from '@/src/components/ui/Text';
import type { Activity } from '@/src/data/types';

interface ActivityRowProps {
  activity: Activity;
  testID?: string;
}

export function ActivityRow({ activity, testID }: ActivityRowProps) {
  const t = useTheme();
  const isEarn = activity.type === 'earn';
  const pointsLabel = isEarn ? `+${activity.points}` : `${activity.points}`;

  return (
    <View
      testID={testID ?? `activity-row-${activity.id}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: t.spacing.md,
        paddingHorizontal: t.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: t.colors.border,
        gap: t.spacing.md,
      }}
    >
      <Badge
        label={isEarn ? 'Earned' : 'Redeemed'}
        variant={isEarn ? 'success' : 'error'}
      />
      <Text variant="body" style={{ flex: 1 }}>
        {activity.title}
      </Text>
      <Text variant="label" color={isEarn ? t.colors.success : t.colors.error}>
        {pointsLabel}
      </Text>
    </View>
  );
}
