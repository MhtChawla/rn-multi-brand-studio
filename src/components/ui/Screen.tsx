import React from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/useTheme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  testID?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function Screen({ children, scroll = false, testID, style, contentStyle }: ScreenProps) {
  const t = useTheme();

  const outerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: t.colors.background,
    ...style,
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={outerStyle} testID={testID}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[{ flexGrow: 1, paddingBottom: t.spacing.xxl }, contentStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
