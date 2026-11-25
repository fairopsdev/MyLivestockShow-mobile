import { QueryClient, QueryClientProvider, focusManager, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/lib/auth';
import { keys } from '@/lib/data';
import { openFromNotification } from '@/lib/links';
import { FairProvider } from '@/lib/fair';
import { registerForPush } from '@/lib/push';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => null);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// Refetch when the app comes back to the front.
AppState.addEventListener('change', (state) => {
  if (Platform.OS !== 'web') focusManager.setFocused(state === 'active');
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Gate />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function Gate() {
  const { status } = useAuth();
  const signedIn = status === 'signedIn';

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync().catch(() => null);
  }, [status]);

  if (status === 'loading') return null;

  return (
    <FairProvider enabled={signedIn}>
      {signedIn ? <PushBridge /> : null}
      <Stack
        screenOptions={{
          headerTintColor: colors.navy,
          headerTitleStyle: { fontWeight: '700', color: colors.navy },
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
          headerBackButtonDisplayMode: 'minimal',
        }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="entry/[id]" options={{ title: 'Entry' }} />
          <Stack.Screen name="enter/index" options={{ title: 'Enter a show' }} />
          <Stack.Screen name="enter/[showId]" options={{ title: 'New entry' }} />
          <Stack.Screen name="cart" options={{ title: 'Cart' }} />
          <Stack.Screen name="messages/index" options={{ title: 'Messages' }} />
          <Stack.Screen name="messages/new" options={{ title: 'New message', presentation: 'modal' }} />
          <Stack.Screen name="messages/[id]" options={{ title: 'Conversation' }} />
          <Stack.Screen name="documents" options={{ title: 'Documents to sign' }} />
          <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
          <Stack.Screen name="settings/notifications" options={{ title: 'Notification settings' }} />
          <Stack.Screen name="profile" options={{ title: 'My profile' }} />
          <Stack.Screen name="delete-account" options={{ title: 'Delete account' }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ title: 'Create account' }} />
          <Stack.Screen name="forgot" options={{ title: 'Reset password' }} />
        </Stack.Protected>
      </Stack>
    </FairProvider>
  );
}

// Registers the phone for notifications and opens the right screen when one is tapped.
function PushBridge() {
  const qc = useQueryClient();
  const last = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    registerForPush({ ask: false }).catch(() => null);
    const sub = Notifications.addNotificationReceivedListener(() => {
      qc.invalidateQueries({ queryKey: keys.notifications });
      qc.invalidateQueries({ queryKey: keys.account });
    });
    return () => sub.remove();
  }, [qc]);

  useEffect(() => {
    const id = last?.notification.request.identifier;
    if (!last || !id || handled.current === id) return;
    handled.current = id;
    const data = (last.notification.request.content.data || {}) as Record<string, string>;
    qc.invalidateQueries();
    openFromNotification(data);
  }, [last, qc]);

  return null;
}
