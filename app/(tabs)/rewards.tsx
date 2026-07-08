import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { RewardCard } from '@/src/components/domain/RewardCard';
import { MOCK_REWARDS } from '@/src/data/mock';
import type { Reward } from '@/src/data/types';

const ALL_CATEGORIES = ['All', ...Array.from(new Set(MOCK_REWARDS.map(r => r.category)))];

export default function RewardsScreen() {
  const t = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered: Reward[] =
    selectedCategory === 'All'
      ? MOCK_REWARDS
      : MOCK_REWARDS.filter(r => r.category === selectedCategory);

  return (
    <Screen testID="rewards-screen">
      <View style={{ paddingTop: t.spacing.xl }}>
        <Text variant="title" style={{ paddingHorizontal: t.spacing.lg, marginBottom: t.spacing.lg }}>
          Rewards
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: t.spacing.lg,
            gap: t.spacing.sm,
            marginBottom: t.spacing.lg,
          }}
        >
          {ALL_CATEGORIES.map(cat => {
            const isSelected = cat === selectedCategory;
            const chipId = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            return (
              <Pressable
                key={cat}
                testID={`filter-chip-${chipId}`}
                onPress={() => setSelectedCategory(cat)}
                style={({ pressed }) => ({
                  paddingHorizontal: t.spacing.md,
                  paddingVertical: t.spacing.sm,
                  borderRadius: t.radius.full,
                  backgroundColor: isSelected ? t.colors.primary : t.colors.surfaceElevated,
                  borderWidth: 1,
                  borderColor: isSelected ? t.colors.primary : t.colors.border,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text
                  variant="label"
                  color={isSelected ? t.colors.onPrimary : t.colors.onSurface}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            paddingHorizontal: t.spacing.lg,
            gap: t.spacing.md,
            paddingBottom: t.spacing.xxl,
          }}
          renderItem={({ item }) => (
            <RewardCard reward={item} testID={`reward-card-${item.id}`} />
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Screen>
  );
}
