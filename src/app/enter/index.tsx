import { useQueries, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Card, Empty, Field, Loading, Muted, Notice, Row, Screen, SectionTitle } from '@/components/ui';
import { call, errorText } from '@/lib/api';
import { keys, useFair } from '@/lib/data';
import { useCurrentFair } from '@/lib/fair';
import { date } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { Fair, FairData, Show } from '@/lib/types';

export default function EnterShow() {
  const { fairs } = useCurrentFair();
  const mine = useQueries({
    queries: fairs.map((f) => ({
      queryKey: keys.fair(f.id),
      queryFn: () => call<FairData>('exhibitorPortal', { action: 'fair', organization_id: f.id }),
    })),
  });
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [picked, setPicked] = useState<Fair | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const search = useQuery({
    queryKey: ['fair-search', term],
    enabled: term.length >= 2,
    queryFn: async () => (await call<{ fairs: (Fair & { open_count: number })[] }>('publicDirectory', { action: 'search', q: term })).fairs || [],
  });

  const myShows = mine.flatMap((m) => (m.data?.shows || []).map((s) => ({ show: s, fair: m.data!.fair })));
  const loading = mine.some((m) => m.isLoading);

  return (
    <Screen>
      <SectionTitle>Open at your fairs</SectionTitle>
      {loading ? <Loading /> : null}
      {!loading && !myShows.length ? <Muted>None of your fairs is taking entries right now.</Muted> : null}
      {myShows.map(({ show, fair }) => <ShowCard key={show.id} show={show} fairName={fair.name} />)}

      <SectionTitle>Find another fair</SectionTitle>
      <Field label="Search by fair or town" value={q} onChangeText={(v) => { setQ(v); setPicked(null); }} placeholder="e.g. Buffalo Island" autoCorrect={false} />
      {search.isFetching ? <Loading /> : null}
      {search.error ? <Notice tone="error">{errorText(search.error)}</Notice> : null}
      {!picked && term.length >= 2 && search.data ? (
        search.data.length ? (
          <Card style={{ padding: 0 }}>
            {search.data.map((f, i) => (
              <Row key={f.id} icon="location" title={f.name} subtitle={[f.address, f.open_count ? `${f.open_count} open now` : ''].filter(Boolean).join(' · ')}
                onPress={() => setPicked(f)} last={i === search.data!.length - 1} />
            ))}
          </Card>
        ) : (
          <Muted>No fairs match &ldquo;{term}&rdquo;.</Muted>
        )
      ) : null}
      {picked ? <PickedFair fair={picked} /> : null}
    </Screen>
  );
}

function PickedFair({ fair }: { fair: Fair }) {
  const q = useFair(fair.id);
  if (q.isLoading) return <Loading />;
  if (q.error) return <Notice tone="error">{errorText(q.error)}</Notice>;
  const shows = q.data?.shows || [];
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 17, fontWeight: '800', color: colors.navy }}>{fair.name}</Text>
      {shows.length ? shows.map((s) => <ShowCard key={s.id} show={s} fairName={fair.name} />) : (
        <Empty icon="calendar-outline" title="Not taking entries" body={`${fair.name} has no shows open for entry right now.`} />
      )}
    </View>
  );
}

function ShowCard({ show, fairName }: { show: Show; fairName: string }) {
  return (
    <Card onPress={() => router.push({ pathname: '/enter/[showId]', params: { showId: show.id } })}>
      <Text style={{ fontSize: 17, fontWeight: '800', color: colors.navy }}>{show.name}</Text>
      <Muted>{[fairName, show.start_date ? date(show.start_date) : ''].filter(Boolean).join(' · ')}</Muted>
      {show.entry_close_date ? <Text style={{ color: colors.amber, fontWeight: '700' }}>Entries close {date(show.entry_close_date)}</Text> : null}
    </Card>
  );
}
