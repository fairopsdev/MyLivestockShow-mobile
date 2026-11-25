import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { EntryCard } from '@/components/EntryCard';
import { Button, Card, Empty, Loading, Muted, Notice, Screen, Segmented, SectionTitle } from '@/components/ui';
import { errorText } from '@/lib/api';
import { useAccount } from '@/lib/data';
import { money } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { Entry } from '@/lib/types';

const DONE = ['completed', 'scratched', 'withdrawn', 'refunded', 'disqualified'];

export default function Entries() {
  const account = useAccount();
  const [view, setView] = useState<'current' | 'past'>('current');
  const entries = account.data?.entries || [];
  const fairName = useMemo(() => Object.fromEntries((account.data?.fairs || []).map((f) => [f.id, f.name])), [account.data]);

  const cart = entries.filter((e) => e.status === 'cart');
  const list = entries.filter((e) => e.status !== 'cart' && e.status !== 'draft' && (view === 'past' ? DONE.includes(e.status) : !DONE.includes(e.status)));
  // Group by show.
  const groups = useMemo(() => {
    const map = new Map<string, { title: string; fair: string; items: Entry[] }>();
    for (const e of list) {
      const g = map.get(e.show_id) || { title: e.show_name || 'Show', fair: fairName[e.organization_id] || '', items: [] };
      g.items.push(e);
      map.set(e.show_id, g);
    }
    return [...map.values()];
  }, [list, fairName]);

  return (
    <Screen refreshing={account.isRefetching} onRefresh={() => account.refetch()}>
      <Button title="Enter a show" icon="add" onPress={() => router.push('/enter')} />
      {cart.length ? (
        <Card onPress={() => router.push('/cart')} style={{ backgroundColor: colors.amberSoft, borderColor: '#F7D9A8' }}>
          <Text style={{ fontWeight: '800', color: colors.amber, fontSize: 16 }}>
            {cart.length} in your cart · {money(cart.reduce((s, e) => s + Number(e.total_fee ?? e.entry_fee ?? 0), 0))}
          </Text>
          <Muted>Not sent yet. Tap to check out.</Muted>
        </Card>
      ) : null}
      <Segmented value={view} onChange={setView} options={[{ value: 'current', label: 'Current' }, { value: 'past', label: 'Past' }]} />
      {account.isLoading ? <Loading /> : null}
      {account.error ? <Notice tone="error">{errorText(account.error)}</Notice> : null}
      {!account.isLoading && !groups.length ? (
        <Empty icon="ribbon-outline" title={view === 'current' ? 'No current entries' : 'No past entries'}
          body={view === 'current' ? 'Entries you send to a show appear here.' : 'Entries from finished shows appear here.'} />
      ) : null}
      {groups.map((g) => (
        <View key={g.title + g.fair} style={{ gap: 8 }}>
          <SectionTitle>{g.title}</SectionTitle>
          {g.fair ? <Muted style={{ marginTop: -6 }}>{g.fair}</Muted> : null}
          {g.items.map((e) => <EntryCard key={e.id} entry={e} />)}
        </View>
      ))}
    </Screen>
  );
}
