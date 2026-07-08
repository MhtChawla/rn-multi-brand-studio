import React from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '@/src/theme/useTheme';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
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
  const qrSize = t.spacing.xxxl * 4;

  return (
    <Card elevated testID={testID ?? 'membership-qr'} style={{ gap: t.spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="heading">{member.name}</Text>
        <Badge label={TIER_LABEL[member.tier]} variant="primary" />
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: t.colors.border,
        }}
      />

      <View style={{ alignItems: 'center', gap: t.spacing.md }}>
        <View
          style={{
            backgroundColor: t.colors.onPrimary,
            padding: t.spacing.md,
            borderRadius: t.radius.md,
          }}
        >
          <QRCode
            value={member.memberId}
            size={qrSize}
            color={t.colors.background}
            backgroundColor={t.colors.onPrimary}
          />
        </View>
        <Text variant="caption" color={t.colors.onSurfaceMuted} align="center">
          {member.memberId}
        </Text>
      </View>
    </Card>
  );
}
