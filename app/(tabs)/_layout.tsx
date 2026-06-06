import { Tabs } from 'expo-router';
import { Home, Lightbulb, Timer } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { StyleSheet, View } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="unstuck"
        options={{
          title: 'Unstuck',
          tabBarIcon: ({ size, color }) => <Lightbulb size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="boredom-buster"
        options={{
          title: 'Focus',
          tabBarIcon: ({ size, color }) => <Timer size={size} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarBg: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  tabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
});
