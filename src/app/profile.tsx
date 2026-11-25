import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Text } from 'react-native';

import { Button, Card, Field, Loading, Muted, Notice, Screen, SectionTitle } from '@/components/ui';
import { call, errorText } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { WEB_URL } from '@/lib/config';
import { keys, useProfile } from '@/lib/data';
import { date } from '@/lib/format';
import { colors } from '@/lib/theme';

const FIELDS: [string, string, object?][] = [
  ['full_name', 'Full name'],
  ['phone', 'Phone', { keyboardType: 'phone-pad', autoComplete: 'tel' }],
  ['address', 'Street address', { autoComplete: 'street-address' }],
  ['city', 'City'],
  ['state', 'State', { autoCapitalize: 'characters' }],
  ['zip', 'ZIP', { keyboardType: 'number-pad', autoComplete: 'postal-code' }],
  ['county', 'County'],
  ['emergency_contact_name', 'Emergency contact'],
  ['emergency_contact_phone', 'Emergency contact phone', { keyboardType: 'phone-pad' }],
];

export default function Profile() {
  const qc = useQueryClient();
  const { refreshUser } = useAuth();
  const q = useProfile();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const form: Record<string, string> = Object.fromEntries(FIELDS.map(([k]) => [k, edits[k] ?? q.data?.account?.[k] ?? '']));

  const save = async () => {
    setMsg(null);
    setBusy(true);
    try {
      await call('exhibitorPortal', { action: 'saveAccount', account: form });
      await Promise.all([qc.invalidateQueries({ queryKey: keys.profile }), refreshUser().catch(() => null)]);
      setEdits({});
      setMsg({ tone: 'success', text: 'Saved.' });
    } catch (e) {
      setMsg({ tone: 'error', text: errorText(e) });
    } finally {
      setBusy(false);
    }
  };

  if (q.isLoading) return <Loading />;
  const people: any[] = q.data?.people || [];

  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      <SectionTitle>Account holder</SectionTitle>
      <Card>
        <Muted>{q.data?.account?.email}</Muted>
        {FIELDS.map(([k, label, props]) => (
          <Field key={k} label={label} value={form[k] || ''} onChangeText={(v) => setEdits((f) => ({ ...f, [k]: v }))} {...(props || {})} />
        ))}
        {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
        <Button title="Save" onPress={save} loading={busy} />
      </Card>

      <SectionTitle>Exhibitors on this account</SectionTitle>
      {!people.length ? <Muted>No exhibitors yet. One is set up the first time you enter a show.</Muted> : null}
      {people.map((p) => (
        <Card key={p.person_id}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: colors.navy }}>
            {[p.profile?.first_name, p.profile?.last_name].filter(Boolean).join(' ') || 'Exhibitor'}
          </Text>
          <Muted>
            {[p.profile?.date_of_birth ? `Born ${date(p.profile.date_of_birth)}` : '', p.profile?.club, p.profile?.county].filter(Boolean).join(' · ')}
          </Muted>
          <Muted>{p.fairs.map((f: any) => f.fair_name + (f.exhibitor_number ? ` (#${f.exhibitor_number})` : '')).join(', ')}</Muted>
          <Muted>{p.entry_count} {p.entry_count === 1 ? 'entry' : 'entries'}</Muted>
        </Card>
      ))}
      <Button title="Edit exhibitors on the web" variant="secondary" icon="open-outline" onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/my/profile`)} />
      <Muted>Changes to an exhibitor update their entries and passes at every fair.</Muted>
    </Screen>
  );
}
