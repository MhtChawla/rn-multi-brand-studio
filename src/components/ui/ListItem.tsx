import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import { Text } from './Text';

interface ListItemProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  testID?: string;
  style?: ViewStyle;
}

export function ListItem({ title, subtitle, right, onPress, testID, style }: ListItemProps) {
  const t = useTheme();

  const inner = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: t.spacing.md,
          paddingHorizontal: t.spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: t.colors.border,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, gap: t.spacing.xs }}>
        <Text variant="body">{title}</Text>
        {subtitle ? (
          <Text variant="caption" color={t.colors.onSurfaceMuted}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        style={({ pressed }) => pressed && { opacity: 0.7 }}
      >
        {inner}
      </Pressable>
    );
  }

  return <View testID={testID}>{inner}</View>;
}
