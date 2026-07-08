import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { PointsBalance } from '@/src/components/domain/PointsBalance';
import { TierProgress } from '@/src/components/domain/TierProgress';
import { RewardCard } from '@/src/components/domain/RewardCard';
import { ActivityRow } from '@/src/components/domain/ActivityRow';
import { MOCK_MEMBER, MOCK_REWARDS, MOCK_ACTIVITIES } from '@/src/data/mock';

const featuredRewards = MOCK_REWARDS.slice(0, 3);
const recentActivities = MOCK_ACTIVITIES.slice(-3).reverse();

export default function HomeScreen() {
  const t = useTheme();

  return (
    <Screen testID="home-screen" scroll>
      <View style={{ paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.xl }}>
        <Text variant="caption" color={t.colors.onSurfaceMuted}>
          Welcome back
        </Text>
        <Text variant="title">{MOCK_MEMBER.name}</Text>
      </View>

      <View style={{ paddingHorizontal: t.spacing.lg, marginTop: t.spacing.xl }}>
        <Card elevated>
          <PointsBalance points={MOCK_MEMBER.points} testID="home-points-balance" />
          <View style={{ marginTop: t.spacing.xl }}>
            <TierProgress
              points={MOCK_MEMBER.points}
              nextTierPoints={MOCK_MEMBER.nextTierPoints}
              tier={MOCK_MEMBER.tier}
              testID="home-tier-progress"
            />
          </View>
        </Card>
      </View>

      <View style={{ marginTop: t.spacing.xxl }}>
        <Text
          variant="heading"
          style={{ paddingHorizontal: t.spacing.lg, marginBottom: t.spacing.md }}
        >
          Featured Rewards
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: t.spacing.lg,
            gap: t.spacing.md,
          }}
        >
          {featuredRewards.map(reward => (
            <View key={reward.id} style={{ width: t.spacing.xxxl * 5 }}>
              <RewardCard reward={reward} testID={`reward-card-${reward.id}`} />
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={{ marginTop: t.spacing.xxl }}>
        <Text
          variant="heading"
          style={{ paddingHorizontal: t.spacing.lg, marginBottom: t.spacing.sm }}
        >
          Recent Activity
        </Text>
        <Card style={{ marginHorizontal: t.spacing.lg, padding: 0 }}>
          {recentActivities.map(activity => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </Card>
      </View>
    </Screen>
  );
}
