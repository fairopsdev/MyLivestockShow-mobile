import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import type { IconName } from '@/components/ui';
import { useNotifications } from '@/lib/data';
import { colors } from '@/lib/theme';

function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={color as string} />;
  };
}

export default function TabsLayout() {
  const notes = useNotifications();
  const unread = notes.data?.unread || 0;
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        headerTintColor: colors.navy,
        headerTitleStyle: { fontWeight: '800', color: colors.navy },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', headerTitle: 'MyLivestockShow', tabBarIcon: icon('home'), tabBarBadge: unread ? unread : undefined }} />
      <Tabs.Screen name="entries" options={{ title: 'Entries', tabBarIcon: icon('ribbon') }} />
      <Tabs.Screen name="weigh-in" options={{ title: 'Weigh-in', tabBarIcon: icon('speedometer') }} />
      <Tabs.Screen name="live" options={{ title: 'Live', headerTitle: 'Ring & results', tabBarIcon: icon('radio') }} />
      <Tabs.Screen name="me" options={{ title: 'Me', headerTitle: 'My account', tabBarIcon: icon('person-circle') }} />
    </Tabs>
  );
}
