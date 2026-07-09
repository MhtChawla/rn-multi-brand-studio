import { ActivityRow } from '@/src/components/domain/ActivityRow';
import { PointsBalance } from '@/src/components/domain/PointsBalance';
import { RewardCard } from '@/src/components/domain/RewardCard';
import { TierProgress } from '@/src/components/domain/TierProgress';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { MOCK_ACTIVITIES, MOCK_MEMBER, MOCK_REWARDS } from '@/src/data/mock';
import { loadLogoSvg } from '@/src/brand/loadBrand';
import { useTheme } from '@/src/theme/useTheme';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

const featuredRewards = MOCK_REWARDS.slice(0, 3);
const recentActivities = MOCK_ACTIVITIES.slice(-3).reverse();

export default function HomeScreen() {
  const t = useTheme();
  const logoSvg = loadLogoSvg();

  return (
    <Screen testID="home-screen" scroll>
      <View
        style={{
          paddingHorizontal: t.spacing.lg,
          paddingTop: t.spacing.xxl,
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.md,
        }}
      >
        {logoSvg !== null && (
          <SvgXml
            xml={logoSvg}
            width={t.spacing.xxxl + t.spacing.sm}
            height={t.spacing.xxxl + t.spacing.sm}
            testID="home-brand-logo"
          />
        )}
        <Text variant="caption" color={t.colors.onSurfaceMuted}>
          Welcome back, {MOCK_MEMBER.name}
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: t.spacing.lg,
          paddingTop: t.spacing.xl,
          paddingBottom: t.spacing.xxl,
          borderBottomWidth: 1,
          borderBottomColor: t.colors.border,
        }}
      >
        <PointsBalance points={MOCK_MEMBER.points} testID="home-points-balance" />
        <View style={{ marginTop: t.spacing.lg }}>
          <TierProgress
            points={MOCK_MEMBER.points}
            nextTierPoints={MOCK_MEMBER.nextTierPoints}
            tier={MOCK_MEMBER.tier}
            testID="home-tier-progress"
          />
        </View>
      </View>

      <View style={{ marginTop: t.spacing.xl }}>
        <Text
          variant="label"
          color={t.colors.onSurfaceMuted}
          style={{ paddingHorizontal: t.spacing.lg, marginBottom: t.spacing.md }}
        >
          Featured rewards
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: t.spacing.lg,
            gap: t.spacing.md,
            paddingVertical: t.spacing.sm
          }}
        >
          {featuredRewards.map(reward => (
            <View key={reward.id} style={{ width: t.spacing.xxxl * 5 }}>
              <RewardCard reward={reward} testID={`reward-card-${reward.id}`} />
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={{ marginTop: t.spacing.xxl, paddingHorizontal: t.spacing.lg }}>
        <Text variant="label" color={t.colors.onSurfaceMuted} style={{ marginBottom: t.spacing.xs }}>
          Recent activity
        </Text>
        {recentActivities.map(activity => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}
      </View>
    </Screen>
  );
}
