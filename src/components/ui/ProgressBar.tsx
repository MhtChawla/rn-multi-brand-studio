import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';

interface ProgressBarProps {
  progress: number;
  testID?: string;
}

export function ProgressBar({ progress, testID }: ProgressBarProps) {
  const t = useTheme();
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [animValue, progress]);

  const fillWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View
      testID={testID}
      style={{
        height: t.spacing.sm,
        backgroundColor: t.colors.surfaceElevated,
        borderRadius: t.radius.full,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          width: fillWidth,
          height: '100%',
          backgroundColor: t.colors.primary,
          borderRadius: t.radius.full,
        }}
      />
    </View>
  );
}
