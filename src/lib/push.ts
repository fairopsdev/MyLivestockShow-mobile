import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { call } from './api';

// Push notifications: ask permission, get this phone's Expo push token and
// register it with Fair Central against the signed-in account. Fair Central
// sends through Expo, which delivers to Apple and Google.

const PUSH_KEY = 'push-token';

// Show notifications while the app is open too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type PushState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Updates',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  // "Your class is up" alerts should break through.
  await Notifications.setNotificationChannelAsync('ring', {
    name: 'My class is up',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 300, 200, 300],
    lightColor: '#C8A24A',
  });
}

function projectId() {
  return (Constants.expoConfig?.extra as any)?.eas?.projectId || Constants.easConfig?.projectId || undefined;
}

export async function pushPermission(): Promise<PushState> {
  if (!Device.isDevice) return 'unavailable';
  const { status } = await Notifications.getPermissionsAsync();
  return status as PushState;
}

/**
 * Register this phone for notifications. Asks for permission only when `ask`
 * is true (so the first launch can explain why before the system prompt).
 */
export async function registerForPush({ ask = false } = {}): Promise<PushState> {
  if (!Device.isDevice) return 'unavailable';
  await ensureChannels();
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted' && ask) status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return status as PushState;
  const id = projectId();
  if (!id) {
    console.warn('No EAS projectId set; run `eas init` so push tokens can be issued.');
    return 'unavailable';
  }
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
  await call('mobileApp', {
    action: 'registerDevice',
    token,
    platform: Platform.OS === 'android' ? 'android' : 'ios',
    app_version: Application.nativeApplicationVersion || Constants.expoConfig?.version || '',
    device_name: Device.modelName || '',
  });
  await SecureStore.setItemAsync(PUSH_KEY, token);
  return 'granted';
}

/** On sign-out: stop this phone getting the account's notifications. */
export async function unregisterPush() {
  const token = await SecureStore.getItemAsync(PUSH_KEY);
  if (!token) return;
  await call('mobileApp', { action: 'unregisterDevice', token }).catch(() => null);
  await SecureStore.deleteItemAsync(PUSH_KEY);
  await Notifications.setBadgeCountAsync(0).catch(() => null);
}
