import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import { Text } from '@/src/components/ui/Text';
import type { Activity } from '@/src/data/types';

function dayLabel(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface ActivityRowProps {
  activity: Activity;
  testID?: string;
}

export function ActivityRow({ activity, testID }: ActivityRowProps) {
  const t = useTheme();
  const isEarn = activity.type === 'earn';
  const pointsLabel = isEarn ? `+${activity.points}` : `−${Math.abs(activity.points)}`;

  return (
    <View
      testID={testID ?? `activity-row-${activity.id}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: t.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: t.colors.border,
        gap: t.spacing.md,
      }}
    >
      <View style={{ flex: 1, gap: t.spacing.xs }}>
        <Text variant="body">{activity.title}</Text>
        <Text variant="caption" color={t.colors.onSurfaceMuted}>
          {dayLabel(activity.dateISO)}
        </Text>
      </View>
      <Text
        variant="body"
        tabular
        color={isEarn ? t.colors.success : t.colors.error}
      >
        {pointsLabel}
      </Text>
    </View>
  );
}
