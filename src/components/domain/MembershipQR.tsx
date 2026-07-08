import React from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '@/src/theme/useTheme';
import { Text } from '@/src/components/ui/Text';
import type { Member, Tier } from '@/src/data/types';

const TIER_LABEL: Record<Tier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

interface MembershipQRProps {
  member: Member;
  testID?: string;
}

export function MembershipQR({ member, testID }: MembershipQRProps) {
  const t = useTheme();
  const qrSize = t.spacing.xxxl * 3.5;

  return (
    <View
      testID={testID ?? 'membership-qr'}
      style={{
        backgroundColor: t.colors.primary,
        borderRadius: t.radius.lg,
        padding: t.spacing.xl,
        ...t.elevation.raised,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <View style={{ gap: t.spacing.xs }}>
          <Text variant="label" color={t.colors.onPrimaryMuted}>
            Member
          </Text>
          <Text variant="heading" color={t.colors.onPrimary}>
            {member.name}
          </Text>
        </View>
        <Text variant="label" color={t.colors.onPrimaryMuted}>
          {TIER_LABEL[member.tier]}
        </Text>
      </View>

      <View style={{ alignItems: 'center', marginVertical: t.spacing.xl }}>
        <View
          style={{
            backgroundColor: t.colors.qrWell,
            padding: t.spacing.lg,
            borderRadius: t.radius.md,
          }}
        >
          <QRCode
            value={member.memberId}
            size={qrSize}
            color={t.colors.background}
            backgroundColor={t.colors.qrWell}
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <View style={{ gap: t.spacing.xs }}>
          <Text variant="label" color={t.colors.onPrimaryMuted}>
            Member ID
          </Text>
          <Text variant="body" color={t.colors.onPrimary} tabular>
            {member.memberId}
          </Text>
        </View>
      </View>
    </View>
  );
}
