import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FairSwitcher } from '@/components/FairSwitcher';
import { Badge, Button, Card, Empty, Loading, Muted, Row, Screen, SectionTitle, type IconName } from '@/components/ui';
import { accountName } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAccount, useConversations, useDocuments, useFair, useNotifications, useRing, useWeighIn } from '@/lib/data';
import { useCurrentFair } from '@/lib/fair';
import { ago, entryTitle, placingText } from '@/lib/format';
import { pushPermission, registerForPush, type PushState } from '@/lib/push';
import { colors, radius, space } from '@/lib/theme';

type Todo = { key: string; icon: IconName; color: string; title: string; subtitle: string; go: () => void };

export default function Home() {
  const { user } = useAuth();
  const { fair } = useCurrentFair();
  const account = useAccount();
  const fairData = useFair(fair?.id);
  const ring = useRing(fair?.id);
  const weigh = useWeighIn();
  const docs = useDocuments();
  const convs = useConversations();
  const notes = useNotifications();
  const [push, setPush] = useState<PushState | null>(null);

  useEffect(() => {
    pushPermission().then(setPush).catch(() => null);
  }, []);

  const refreshing = account.isRefetching || fairData.isRefetching || ring.isRefetching;
  const refresh = () => {
    account.refetch();
    fairData.refetch();
    ring.refetch();
    weigh.refetch();
    docs.refetch();
    convs.refetch();
    notes.refetch();
  };

  const entries = account.data?.entries || [];
  const todos: Todo[] = [];
  const fixes = entries.filter((e) => e.status === 'needs_correction');
  fixes.forEach((e) => todos.push({
    key: `fix-${e.id}`, icon: 'alert-circle', color: colors.red, title: `Fix your entry: ${entryTitle(e)}`,
    subtitle: e.admin_notes || `${e.class_name || ''} ${e.show_name ? `· ${e.show_name}` : ''}`.trim(),
    go: () => router.push({ pathname: '/entry/[id]', params: { id: e.id } }),
  }));
  const cart = entries.filter((e) => e.status === 'cart');
  if (cart.length) todos.push({
    key: 'cart', icon: 'cart', color: colors.amber, title: `${cart.length} ${cart.length === 1 ? 'entry' : 'entries'} in your cart`,
    subtitle: 'Check out to send them to the show office.', go: () => router.push('/cart'),
  });
  const needWeight = (weigh.data || []).filter((w) => w.can_submit_now && ['not_weighed', 'voided'].includes(w.weight_status));
  if (needWeight.length) todos.push({
    key: 'weigh', icon: 'speedometer', color: colors.blue, title: `Submit ${needWeight.length} ${needWeight.length === 1 ? 'weight' : 'weights'}`,
    subtitle: 'Weigh-in is open now.', go: () => router.navigate('/weigh-in'),
  });
  const toSign = (docs.data || []).filter((d) => ['sent', 'delivered'].includes(d.status));
  if (toSign.length) todos.push({
    key: 'sign', icon: 'create', color: colors.navy, title: `${toSign.length} ${toSign.length === 1 ? 'document' : 'documents'} to sign`,
    subtitle: toSign.map((d) => d.document_name).join(', '), go: () => router.push('/documents'),
  });
  const unreadConvs = (convs.data || []).filter((c) => c.unread);
  if (unreadConvs.length) todos.push({
    key: 'msg', icon: 'chatbubbles', color: colors.green, title: `${unreadConvs.length} new ${unreadConvs.length === 1 ? 'reply' : 'replies'} from the show office`,
    subtitle: unreadConvs[0].subject, go: () => router.push('/messages'),
  });

  const upNext = (ring.data?.my_classes || []).filter((c) => c.state !== 'later').slice(0, 3);
  const later = (ring.data?.my_classes || []).filter((c) => c.state === 'later');
  const placed = (fairData.data?.entries || []).filter((e) => e.result).slice(0, 3);
  const first = accountName(user).first;
  const unread = notes.data?.unread || 0;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={s.hello}>
        <View style={{ flex: 1 }}>
          <Text style={s.helloText}>{first ? `Hi, ${first}` : 'Welcome'}</Text>
          <FairSwitcher />
        </View>
        <Pressable onPress={() => router.push('/notifications')} style={s.bell} accessibilityLabel="Notifications">
          <Ionicons name="notifications" size={22} color={colors.navy} />
          {unread ? <View style={s.dot}><Text style={s.dotText}>{unread > 9 ? '9+' : unread}</Text></View> : null}
        </Pressable>
      </View>

      {push === 'undetermined' ? (
        <Card style={{ backgroundColor: colors.goldSoft, borderColor: colors.gold }}>
          <Text style={s.cardTitle}>Know when your class is up</Text>
          <Muted>Get a notification when your entry is approved, your weight is official, your class is on deck and results are posted.</Muted>
          <Button title="Turn on notifications" icon="notifications" onPress={async () => setPush(await registerForPush({ ask: true }))} />
        </Card>
      ) : null}

      {upNext.map((c) => (
        <Card key={`${c.ring_id}-${c.class_id}`} onPress={() => router.navigate({ pathname: '/live', params: { tab: 'ring' } })}
          style={c.state === 'in_ring' ? s.inRing : s.onDeck}>
          <Text style={[s.upLabel, { color: c.state === 'in_ring' ? '#fff' : colors.navy }]}>
            {c.state === 'in_ring' ? 'IN THE RING NOW' : 'ON DECK'} · {c.ring_name}
          </Text>
          <Text style={[s.upClass, { color: c.state === 'in_ring' ? '#fff' : colors.navy }]}>{c.class_name}</Text>
          <Text style={{ color: c.state === 'in_ring' ? '#E8EEF8' : colors.muted }}>
            {c.mine.map((m) => [m.entry_number ? `#${m.entry_number}` : '', m.animal_name || m.exhibitor_name].filter(Boolean).join(' ')).join(' · ')}
          </Text>
        </Card>
      ))}

      <View style={s.actions}>
        <Action icon="add-circle" label="Enter a show" onPress={() => router.push('/enter')} />
        <Action icon="speedometer" label="Weigh-in" onPress={() => router.navigate('/weigh-in')} />
        <Action icon="radio" label="Live ring" onPress={() => router.navigate({ pathname: '/live', params: { tab: 'ring' } })} />
        <Action icon="trophy" label="Results" onPress={() => router.navigate({ pathname: '/live', params: { tab: 'results' } })} />
      </View>

      <SectionTitle>To do</SectionTitle>
      {account.isLoading ? (
        <Loading />
      ) : todos.length ? (
        <Card style={{ padding: 0 }}>
          {todos.map((t, i) => (
            <Row key={t.key} icon={t.icon} iconColor={t.color} title={t.title} subtitle={t.subtitle} onPress={t.go} last={i === todos.length - 1} />
          ))}
        </Card>
      ) : (
        <Card>
          <Text style={s.cardTitle}>You&apos;re all caught up</Text>
          <Muted>Nothing needs your attention right now.</Muted>
        </Card>
      )}

      {later.length ? (
        <>
          <SectionTitle>Coming up in the ring</SectionTitle>
          <Card style={{ padding: 0 }}>
            {later.slice(0, 5).map((c, i, arr) => (
              <Row key={`${c.ring_id}-${c.class_id}`} icon="time" title={c.class_name}
                subtitle={`${c.ring_name} · ${c.classes_ahead} ${c.classes_ahead === 1 ? 'class' : 'classes'} ahead`}
                onPress={() => router.navigate({ pathname: '/live', params: { tab: 'ring' } })} last={i === arr.length - 1} />
            ))}
          </Card>
        </>
      ) : null}

      {placed.length ? (
        <>
          <SectionTitle action={<Text style={s.more} onPress={() => router.navigate({ pathname: '/live', params: { tab: 'results' } })}>All results</Text>}>
            Latest results
          </SectionTitle>
          <Card style={{ padding: 0 }}>
            {placed.map((e, i) => (
              <Row key={e.id} icon={e.result?.is_champion ? 'trophy' : 'ribbon'} iconColor={colors.gold} title={entryTitle(e)}
                subtitle={`${e.class_name || ''}`} right={<Badge label={placingText(e.result)} fg={colors.navy} bg={colors.goldSoft} />}
                onPress={() => router.push({ pathname: '/entry/[id]', params: { id: e.id } })} last={i === placed.length - 1} />
            ))}
          </Card>
        </>
      ) : null}

      {!account.isLoading && !entries.length ? (
        <Empty icon="ribbon-outline" title="No entries yet" body="Find your fair's show and enter in a few taps."
          action={<Button title="Enter a show" icon="add" onPress={() => router.push('/enter')} />} />
      ) : null}

      {notes.data?.notifications?.length ? (
        <>
          <SectionTitle action={<Text style={s.more} onPress={() => router.push('/notifications')}>See all</Text>}>Recent updates</SectionTitle>
          <Card style={{ padding: 0 }}>
            {notes.data.notifications.slice(0, 3).map((n, i, arr) => (
              <Row key={n.id} title={n.title} subtitle={`${n.body ? `${n.body} · ` : ''}${ago(n.created_date)}`}
                icon={n.read ? 'notifications-outline' : 'notifications'} onPress={() => router.push('/notifications')} last={i === arr.length - 1} />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Action({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.action, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={24} color={colors.navy} />
      <Text style={s.actionText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  hello: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  helloText: { fontSize: 26, fontWeight: '800', color: colors.navy, letterSpacing: -0.4 },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  dot: { position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  dotText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.navy },
  inRing: { backgroundColor: colors.navy, borderColor: colors.navy },
  onDeck: { backgroundColor: colors.goldSoft, borderColor: colors.gold },
  upLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  upClass: { fontSize: 22, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: space.sm },
  action: { flex: 1, backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingVertical: space.md, alignItems: 'center', gap: 6 },
  actionText: { fontSize: 12, fontWeight: '700', color: colors.navy, textAlign: 'center' },
  more: { color: colors.navy, fontWeight: '700', fontSize: 14 },
});
