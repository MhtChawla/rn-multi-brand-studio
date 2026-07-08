import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/useTheme';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { ListItem } from '@/src/components/ui/ListItem';
import { MOCK_MEMBER } from '@/src/data/mock';

const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

export default function ProfileScreen() {
  const t = useTheme();
  const tierLabel = TIER_LABEL[MOCK_MEMBER.tier] ?? MOCK_MEMBER.tier;
  const chevron = <Ionicons name="chevron-forward" size={t.spacing.lg} color={t.colors.onSurfaceMuted} />;

  return (
    <Screen testID="profile-screen" scroll contentStyle={{ paddingHorizontal: t.spacing.lg }}>
      <View style={{ paddingTop: t.spacing.xxl, marginBottom: t.spacing.xl }}>
        <Text variant="title">Profile</Text>
      </View>

      <Card elevated style={{ gap: t.spacing.lg, marginBottom: t.spacing.xxl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ gap: t.spacing.xs }}>
            <Text variant="heading">{MOCK_MEMBER.name}</Text>
            <Text variant="caption" color={t.colors.onSurfaceMuted} tabular>
              {MOCK_MEMBER.memberId}
            </Text>
          </View>
          <Badge label={tierLabel} variant="primary" />
        </View>

        <View
          style={{
            flexDirection: 'row',
            paddingTop: t.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: t.colors.border,
            gap: t.spacing.xxl,
          }}
        >
          <View style={{ gap: t.spacing.xs }}>
            <Text variant="label" color={t.colors.onSurfaceMuted}>
              Points
            </Text>
            <Text variant="heading" tabular>
              {MOCK_MEMBER.points.toLocaleString('en-US')}
            </Text>
          </View>
          <View style={{ gap: t.spacing.xs }}>
            <Text variant="label" color={t.colors.onSurfaceMuted}>
              Next tier at
            </Text>
            <Text variant="heading" tabular>
              {MOCK_MEMBER.nextTierPoints.toLocaleString('en-US')}
            </Text>
          </View>
        </View>
      </Card>

      <Text variant="label" color={t.colors.onSurfaceMuted} style={{ marginBottom: t.spacing.xs }}>
        Settings
      </Text>
      <ListItem
        title="Notifications"
        subtitle="Push notification preferences"
        right={chevron}
        testID="settings-notifications"
        style={{ paddingHorizontal: 0 }}
      />
      <ListItem
        title="Language"
        subtitle="English"
        right={chevron}
        testID="settings-language"
        style={{ paddingHorizontal: 0 }}
      />
      <ListItem
        title="About"
        subtitle="App version 1.0.0"
        right={chevron}
        testID="settings-about"
        style={{ paddingHorizontal: 0, borderBottomWidth: 0 }}
      />
    </Screen>
  );
}
