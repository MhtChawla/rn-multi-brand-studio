import React, { useMemo } from 'react';
import { SectionList, View } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { ActivityRow } from '@/src/components/domain/ActivityRow';
import { MOCK_ACTIVITIES } from '@/src/data/mock';
import type { Activity } from '@/src/data/types';

function monthLabel(dateISO: string): string {
  const parts = dateISO.split('-');
  const year = parts[0] ?? '2024';
  const month = parts[1] ?? '01';
  const d = new Date(`${year}-${month}-01`);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

type Section = { title: string; data: Activity[] };

function groupByMonth(activities: Activity[]): Section[] {
  const groups = new Map<string, Activity[]>();
  for (const activity of activities) {
    const key = monthLabel(activity.dateISO);
    const existing = groups.get(key) ?? [];
    groups.set(key, [...existing, activity]);
  }
  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}

export default function ActivityScreen() {
  const t = useTheme();

  const sections = useMemo(() => {
    const reversed = [...MOCK_ACTIVITIES].reverse();
    return groupByMonth(reversed);
  }, []);

  return (
    <Screen testID="activity-screen">
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.xl, paddingBottom: t.spacing.md }}>
            <Text variant="title">Activity</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View
            style={{
              paddingHorizontal: t.spacing.lg,
              paddingVertical: t.spacing.sm,
              backgroundColor: t.colors.background,
            }}
          >
            <Text variant="label" color={t.colors.onSurfaceMuted}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <ActivityRow activity={item} testID={`activity-row-${item.id}`} />
        )}
        contentContainerStyle={{ paddingBottom: t.spacing.xxl }}
      />
    </Screen>
  );
}
