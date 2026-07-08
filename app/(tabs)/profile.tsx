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
      <View style={{ paddingTop: t.spacing.xl, marginBottom: t.spacing.xl }}>
        <Text variant="title">Profile</Text>
      </View>

      <Card style={{ gap: t.spacing.md, marginBottom: t.spacing.xl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text variant="heading">{MOCK_MEMBER.name}</Text>
            <Text variant="caption" color={t.colors.onSurfaceMuted} style={{ marginTop: t.spacing.xs }}>
              Member ID: {MOCK_MEMBER.memberId}
            </Text>
          </View>
          <Badge label={tierLabel} variant="primary" />
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingTop: t.spacing.md,
            borderTopWidth: 1,
            borderTopColor: t.colors.border,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Text variant="heading" color={t.colors.primary}>
              {MOCK_MEMBER.points.toLocaleString('en-US')}
            </Text>
            <Text variant="caption" color={t.colors.onSurfaceMuted}>
              Points
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text variant="heading" color={t.colors.primary}>
              {MOCK_MEMBER.nextTierPoints.toLocaleString('en-US')}
            </Text>
            <Text variant="caption" color={t.colors.onSurfaceMuted}>
              Next Tier
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text variant="heading" color={t.colors.accent}>
              {tierLabel}
            </Text>
            <Text variant="caption" color={t.colors.onSurfaceMuted}>
              Status
            </Text>
          </View>
        </View>
      </Card>

      <Text variant="label" color={t.colors.onSurfaceMuted} style={{ marginBottom: t.spacing.sm }}>
        SETTINGS
      </Text>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <ListItem
          title="Notifications"
          subtitle="Manage push notification preferences"
          right={chevron}
          testID="settings-notifications"
        />
        <ListItem
          title="Language"
          subtitle="English"
          right={chevron}
          testID="settings-language"
        />
        <ListItem
          title="About"
          subtitle="App version 1.0.0"
          right={chevron}
          testID="settings-about"
          style={{ borderBottomWidth: 0 }}
        />
      </Card>
    </Screen>
  );
}
