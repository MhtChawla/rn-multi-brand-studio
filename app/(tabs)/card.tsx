import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { MembershipQR } from '@/src/components/domain/MembershipQR';
import { MOCK_MEMBER } from '@/src/data/mock';

export default function CardScreen() {
  const t = useTheme();

  return (
    <Screen testID="card-screen" scroll contentStyle={{ paddingHorizontal: t.spacing.lg }}>
      <View style={{ paddingTop: t.spacing.xxl, marginBottom: t.spacing.xl }}>
        <Text variant="title">Membership card</Text>
      </View>

      <MembershipQR member={MOCK_MEMBER} testID="membership-qr-card" />

      <Text
        variant="caption"
        color={t.colors.onSurfaceMuted}
        align="center"
        style={{ marginTop: t.spacing.xl, paddingHorizontal: t.spacing.xl }}
      >
        Show this code at the counter to earn or redeem points.
      </Text>
    </Screen>
  );
}
