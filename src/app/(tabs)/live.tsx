import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FairSwitcher } from '@/components/FairSwitcher';
import { Badge, Card, Empty, Field, Loading, Muted, Notice, Screen, Segmented, SectionTitle } from '@/components/ui';
import { errorText } from '@/lib/api';
import { useFair, useFairResults, useRing } from '@/lib/data';
import { useCurrentFair } from '@/lib/fair';
import { ago, placingText } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';
import type { Ring } from '@/lib/types';

export default function Live() {
  const params = useLocalSearchParams<{ tab?: string; fair?: string }>();
  const { fair, fairs, setFairId } = useCurrentFair();
  const [tab, setTab] = useState<'ring' | 'results'>(params.tab === 'results' ? 'results' : 'ring');
  // Opening this tab from a notification or a Home card picks the view.
  const [lastParam, setLastParam] = useState(params.tab);
  if (params.tab !== lastParam) {
    setLastParam(params.tab);
    if (params.tab === 'results' || params.tab === 'ring') setTab(params.tab);
  }
  useEffect(() => {
    if (params.fair && fairs.some((f) => f.id === params.fair)) setFairId(params.fair);
  }, [params.fair, fairs, setFairId]);

  const ring = useRing(fair?.id);
  const results = useFairResults(tab === 'results' ? fair?.id : null);

  if (!fair) {
    return (
      <Screen>
        <Empty icon="radio-outline" title="No fair yet" body="Once you enter a show, its rings and results show up here." />
      </Screen>
    );
  }

  return (
    <Screen
      refreshing={tab === 'ring' ? ring.isRefetching : results.isRefetching}
      onRefresh={() => (tab === 'ring' ? ring.refetch() : results.refetch())}>
      <FairSwitcher />
      <Segmented value={tab} onChange={setTab} options={[{ value: 'ring', label: 'Ring' }, { value: 'results', label: 'Results' }]} />
      {tab === 'ring' ? <RingView q={ring} /> : <ResultsView q={results} fairId={fair.id} />}
    </Screen>
  );
}

function RingView({ q }: { q: ReturnType<typeof useRing> }) {
  if (q.isLoading) return <Loading />;
  if (q.error) return <Notice tone="error">{errorText(q.error)}</Notice>;
  const rings = q.data?.rings || [];
  const mine = q.data?.my_classes || [];
  if (!rings.length) return <Empty icon="radio-outline" title="No rings running" body="When the show office starts a ring, you'll see what's in it here." />;
  return (
    <>
      {mine.length ? (
        <Card style={{ backgroundColor: colors.navy, borderColor: colors.navy }}>
          <Text style={s.mineLabel}>MY CLASSES</Text>
          {mine.slice(0, 4).map((c) => (
            <View key={`${c.ring_id}-${c.class_id}`} style={s.mineRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.mineClass} numberOfLines={1}>{c.class_name}</Text>
                <Text style={s.mineSub}>{c.ring_name}</Text>
              </View>
              <Badge
                label={c.state === 'in_ring' ? 'In the ring' : c.state === 'on_deck' ? 'On deck' : `${c.classes_ahead} ahead`}
                fg={c.state === 'in_ring' ? colors.navy : c.state === 'on_deck' ? colors.navy : '#fff'}
                bg={c.state === 'in_ring' ? colors.gold : c.state === 'on_deck' ? '#fff' : colors.navySoft} />
            </View>
          ))}
        </Card>
      ) : null}
      {rings.map((r) => <RingCard key={r.id} ring={r} />)}
      <Muted style={{ textAlign: 'center' }}>Updates every 20 seconds.</Muted>
    </>
  );
}

function RingCard({ ring }: { ring: Ring }) {
  const calling = ring.queue.find((x) => x.state === 'calling');
  const upcoming = ring.queue.filter((x) => x.state === 'queued');
  const done = ring.queue.filter((x) => x.state === 'done').slice(-2);
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.navy }}>{ring.name}</Text>
        {ring.updated_date ? <Muted>{ago(ring.updated_date)}</Muted> : null}
      </View>
      <View style={s.now}>
        <Text style={s.nowLabel}>IN THE RING</Text>
        <Text style={s.nowClass}>{calling?.class_name || ring.current_class_name || 'Nothing right now'}</Text>
        {calling?.entry_count ? <Muted>{calling.entry_count} entries</Muted> : null}
        {calling?.mine.length ? <MineLine items={calling.mine} /> : null}
      </View>
      {upcoming.length ? (
        <View style={{ gap: 2 }}>
          {upcoming.slice(0, 8).map((c, i) => (
            <View key={c.class_id} style={[s.qRow, c.mine.length ? s.qMine : null]}>
              <Text style={s.qNum}>{i === 0 ? 'Next' : `${i + 1}`}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.qClass} numberOfLines={2}>{c.class_name}</Text>
                {c.mine.length ? <MineLine items={c.mine} /> : null}
              </View>
              {c.entry_count ? <Muted>{c.entry_count}</Muted> : null}
            </View>
          ))}
          {upcoming.length > 8 ? <Muted>+ {upcoming.length - 8} more classes</Muted> : null}
        </View>
      ) : null}
      {done.length ? <Muted>Just finished: {done.map((d) => d.class_name).join(', ')}</Muted> : null}
    </Card>
  );
}

function MineLine({ items }: { items: Ring['queue'][number]['mine'] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name="star" size={12} color={colors.gold} />
      <Text style={{ color: colors.navy, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>
        You: {items.map((m) => [m.entry_number ? `#${m.entry_number}` : '', m.animal_name || m.exhibitor_name].filter(Boolean).join(' ')).join(', ')}
      </Text>
    </View>
  );
}

function ResultsView({ q, fairId }: { q: ReturnType<typeof useFairResults>; fairId: string }) {
  const fair = useFair(fairId);
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [search, setSearch] = useState('');
  const myExhibitors = useMemo(() => new Set((fair.data?.exhibitors || []).map((x) => x.id)), [fair.data]);
  const groups = useMemo(() => {
    const words = search.toLowerCase().split(/\s+/).filter(Boolean);
    const rows = (q.data?.results || []).filter((r) => (scope === 'all' || myExhibitors.has(r.exhibitor_id))
      && words.every((w) => `${r.class_name} ${r.department_name} ${r.exhibitor_name} ${r.animal_name}`.toLowerCase().includes(w)));
    const map = new Map<string, { title: string; dept: string; rows: any[] }>();
    for (const r of rows) {
      const g = map.get(r.class_id) || { title: r.class_name, dept: r.department_name, rows: [] as any[] };
      g.rows.push(r);
      map.set(r.class_id, g);
    }
    for (const g of map.values()) g.rows.sort((a, b) => (a.placing ?? 999) - (b.placing ?? 999));
    return [...map.values()];
  }, [q.data, scope, search, myExhibitors]);

  if (q.isLoading) return <Loading />;
  if (q.error) return <Notice tone="error">{errorText(q.error)}</Notice>;
  return (
    <>
      <Segmented value={scope} onChange={setScope} options={[{ value: 'mine', label: 'My results' }, { value: 'all', label: 'Everyone' }]} />
      {scope === 'all' ? <Field label="Search" value={search} onChangeText={setSearch} placeholder="Class, exhibitor or animal" /> : null}
      {!groups.length ? (
        <Empty icon="trophy-outline" title="No results yet" body={scope === 'mine' ? 'Your placings appear here as soon as the show office posts them.' : 'Results appear here once they are posted.'} />
      ) : null}
      {groups.slice(0, 80).map((g) => (
        <View key={g.title + g.dept} style={{ gap: 6 }}>
          <SectionTitle>{g.title}</SectionTitle>
          <Card style={{ padding: 0 }}>
            {g.rows.slice(0, 15).map((r, i) => {
              const mine = myExhibitors.has(r.exhibitor_id);
              return (
                <View key={r.id} style={[s.result, i < g.rows.length - 1 && s.resultLine, mine && { backgroundColor: colors.goldSoft }]}>
                  <Text style={s.place}>{r.placing ?? '–'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.navy }}>{r.exhibitor_name || 'Exhibitor'}{mine ? '  ★' : ''}</Text>
                    <Muted>{[r.animal_name, r.award && r.award !== placingText(r) ? r.award : ''].filter(Boolean).join(' · ')}</Muted>
                  </View>
                  {r.is_champion ? <Ionicons name="trophy" size={18} color={colors.gold} /> : null}
                </View>
              );
            })}
          </Card>
        </View>
      ))}
    </>
  );
}

const s = StyleSheet.create({
  mineLabel: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  mineRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6 },
  mineClass: { color: '#fff', fontSize: 16, fontWeight: '800' },
  mineSub: { color: '#C9D4E8', fontSize: 13 },
  now: { backgroundColor: colors.bg, borderRadius: radius.md, padding: space.md, gap: 2 },
  nowLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.green },
  nowClass: { fontSize: 18, fontWeight: '800', color: colors.navy },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 8 },
  qMine: { backgroundColor: colors.goldSoft },
  qNum: { width: 36, fontWeight: '800', color: colors.muted, fontSize: 13 },
  qClass: { fontSize: 15, fontWeight: '600', color: colors.navy },
  result: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg },
  resultLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  place: { width: 28, fontSize: 18, fontWeight: '800', color: colors.navy, textAlign: 'center' },
});
