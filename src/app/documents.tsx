import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Badge, Button, Card, Empty, Loading, Muted, Notice, Screen, SectionTitle } from '@/components/ui';
import { call, errorText } from '@/lib/api';
import { keys, useDocuments } from '@/lib/data';
import { date } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { SignDoc } from '@/lib/types';

export default function Documents() {
  const q = useDocuments();
  const waiting = (q.data || []).filter((d) => ['sent', 'delivered'].includes(d.status));
  const signed = (q.data || []).filter((d) => d.status === 'completed');
  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      {q.isLoading ? <Loading /> : null}
      {q.error ? <Notice tone="error">{errorText(q.error)}</Notice> : null}
      {!q.isLoading && !q.data?.length ? (
        <Empty icon="document-text-outline" title="Nothing to sign" body="When a fair sends you a form or agreement to sign, it shows up here." />
      ) : null}
      {waiting.length ? <SectionTitle>Waiting for you</SectionTitle> : null}
      {waiting.map((d) => <DocCard key={d.id} doc={d} />)}
      {signed.length ? <SectionTitle>Signed</SectionTitle> : null}
      {signed.map((d) => <DocCard key={d.id} doc={d} />)}
    </Screen>
  );
}

function DocCard({ doc: d }: { doc: SignDoc }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const done = d.status === 'completed';

  const open = async () => {
    setBusy(true);
    try {
      const res = await call<{ url: string }>('signatures', { action: done ? 'myDownload' : 'signSession', id: d.id });
      if (!res.url) throw new Error('The document could not be opened.');
      await WebBrowser.openBrowserAsync(res.url);
      // Back from signing: refresh so it moves to "Signed".
      await call('signatures', { action: 'mine' }).catch(() => null);
      qc.invalidateQueries({ queryKey: keys.documents });
    } catch (e) {
      Alert.alert('Could not open the document', errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.navy, flex: 1 }}>{d.document_name}</Text>
        <Badge label={done ? 'Signed' : 'To sign'} fg={done ? colors.green : colors.amber} bg={done ? colors.greenSoft : colors.amberSoft} />
      </View>
      <Muted>{d.fair_name}{done && d.completed_at ? ` · Signed ${date(d.completed_at)}` : d.sent_at ? ` · Sent ${date(d.sent_at)}` : ''}</Muted>
      <Button title={done ? 'View signed copy' : 'Review and sign'} variant={done ? 'secondary' : 'primary'} small onPress={open} loading={busy} />
    </Card>
  );
}
