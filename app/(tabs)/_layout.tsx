import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, type GestureResponderEvent } from 'react-native';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/src/theme/useTheme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function makeTabButton(testID: string) {
  return function TabButton({
    children,
    onPress,
    onLongPress,
    style,
    accessibilityRole,
    accessibilityState,
    accessibilityLabel,
  }: BottomTabBarButtonProps) {
    return (
      <TouchableOpacity
        testID={testID}
        onPress={onPress as (e: GestureResponderEvent) => void}
        onLongPress={onLongPress as (e: GestureResponderEvent) => void}
        style={style}
        accessibilityRole={accessibilityRole}
        accessibilityState={accessibilityState}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </TouchableOpacity>
    );
  };
}

function TabIcon({ name, color, size }: { name: IoniconName; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabLayout() {
  const t = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.onSurfaceMuted,
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: t.typography.variant.caption,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarButton: makeTabButton('tab-home'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarButton: makeTabButton('tab-rewards'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="gift" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="card"
        options={{
          title: 'Card',
          tabBarButton: makeTabButton('tab-card'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="card" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarButton: makeTabButton('tab-activity'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="time" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarButton: makeTabButton('tab-profile'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
