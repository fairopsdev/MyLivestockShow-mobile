import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Text, View } from 'react-native';

import { Badge, Card, Muted, Row, Screen, SectionTitle } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { WEB_URL } from '@/lib/config';
import { useAccount, useConversations, useDocuments, useNotifications } from '@/lib/data';
import { colors } from '@/lib/theme';

export default function Me() {
  const { user, signOut } = useAuth();
  const convs = useConversations();
  const docs = useDocuments();
  const notes = useNotifications();
  const account = useAccount();
  const unreadMsgs = (convs.data || []).filter((c) => c.unread).length;
  const toSign = (docs.data || []).filter((d) => ['sent', 'delivered'].includes(d.status)).length;
  const cart = (account.data?.entries || []).filter((e) => e.status === 'cart').length;
  const count = (n: number) => (n ? <Badge label={String(n)} fg="#fff" bg={colors.red} /> : null);

  return (
    <Screen>
      <Card>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.navy }}>{user?.full_name || 'Your account'}</Text>
        <Muted>{user?.email}</Muted>
      </Card>

      <SectionTitle>Account</SectionTitle>
      <Card style={{ padding: 0 }}>
        <Row icon="people" title="My profile" subtitle="Your details and the exhibitors on your account" onPress={() => router.push('/profile')} />
        <Row icon="cart" title="Cart" right={count(cart)} onPress={() => router.push('/cart')} />
        <Row icon="chatbubbles" title="Messages" subtitle="Talk to the show office" right={count(unreadMsgs)} onPress={() => router.push('/messages')} />
        <Row icon="create" title="Documents to sign" right={count(toSign)} onPress={() => router.push('/documents')} last />
      </Card>

      <SectionTitle>Notifications</SectionTitle>
      <Card style={{ padding: 0 }}>
        <Row icon="notifications" title="All notifications" right={count(notes.data?.unread || 0)} onPress={() => router.push('/notifications')} />
        <Row icon="options" title="Notification settings" subtitle="Choose what your phone alerts you about" onPress={() => router.push('/settings/notifications')} last />
      </Card>

      <SectionTitle>More</SectionTitle>
      <Card style={{ padding: 0 }}>
        <Row icon="globe" title="Open Fair Central on the web" onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/account`)} />
        <Row icon="help-buoy" title="Help" onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/help`)} />
        <Row icon="log-out" title="Sign out" onPress={() => Alert.alert('Sign out?', 'This phone will stop getting your notifications.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
        ])} />
        <Row icon="trash" iconColor={colors.red} title="Delete my account" onPress={() => router.push('/delete-account')} last />
      </Card>
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Muted>MyLivestockShow {Constants.expoConfig?.version || ''} · by Fair Central</Muted>
      </View>
    </Screen>
  );
}
