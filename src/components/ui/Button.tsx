import React from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle;
}

export function Button({
  label,
  variant = 'primary',
  onPress,
  disabled = false,
  testID,
  style,
}: ButtonProps) {
  const t = useTheme();

  const base: ViewStyle = {
    borderRadius: t.radius.md,
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const variantStyle: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: t.colors.primary },
    secondary: {
      backgroundColor: t.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    ghost: { backgroundColor: 'transparent' },
  };

  const textColorMap: Record<ButtonVariant, string> = {
    primary: t.colors.onPrimary,
    secondary: t.colors.onSurface,
    ghost: t.colors.primary,
  };

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        base,
        variantStyle[variant],
        pressed && { opacity: 0.75 },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      <Text variant="label" color={textColorMap[variant]}>
        {label}
      </Text>
    </Pressable>
  );
}
