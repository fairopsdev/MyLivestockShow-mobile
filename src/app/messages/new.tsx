import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Card, ChoiceList, Field, Muted, Notice, Screen, SectionTitle } from '@/components/ui';
import { call, errorText } from '@/lib/api';
import { keys } from '@/lib/data';
import { useCurrentFair } from '@/lib/fair';
import { colors, radius } from '@/lib/theme';

const TOPICS = [
  { value: 'entries', label: 'Entries' },
  { value: 'weigh_in', label: 'Weigh-in' },
  { value: 'payments', label: 'Payments' },
  { value: 'results', label: 'Results' },
  { value: 'general', label: 'Something else' },
];

export default function NewMessage() {
  const p = useLocalSearchParams<{ organization_id?: string; entry_id?: string; show_id?: string; subject?: string }>();
  const qc = useQueryClient();
  const { fairs, fair } = useCurrentFair();
  const [orgId, setOrgId] = useState(p.organization_id || fair?.id || '');
  const [topic, setTopic] = useState(p.entry_id ? 'entries' : 'general');
  const [subject, setSubject] = useState(p.subject || '');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    setError('');
    if (!orgId) return setError('Choose the fair you want to contact.');
    if (!subject.trim() || !body.trim()) return setError('Add a subject and a message.');
    setBusy(true);
    try {
      const res = await call<{ conversation: { id: string } }>('fairMessages', {
        action: 'myCreate', organization_id: orgId, subject: subject.trim(), body: body.trim(), category: topic,
        entry_id: p.entry_id || undefined, show_id: p.show_id || undefined,
      });
      qc.invalidateQueries({ queryKey: keys.conversations });
      router.dismiss();
      if (res.conversation?.id) router.push({ pathname: '/messages/[id]', params: { id: res.conversation.id } });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      {fairs.length > 1 && !p.organization_id ? (
        <>
          <SectionTitle>Fair</SectionTitle>
          <ChoiceList items={fairs} selected={orgId} onSelect={(f) => setOrgId(f.id)} label={(f) => f.name} keyOf={(f) => f.id} />
        </>
      ) : (
        <Muted>To: {fairs.find((f) => f.id === orgId)?.name || 'the show office'}</Muted>
      )}
      <SectionTitle>About</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {TOPICS.map((t) => (
          <Pressable key={t.value} onPress={() => setTopic(t.value)}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: topic === t.value ? colors.navy : colors.line, backgroundColor: topic === t.value ? colors.navy : '#fff' }}>
            <Text style={{ color: topic === t.value ? '#fff' : colors.navy, fontWeight: '700' }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <Card>
        <Field label="Subject" value={subject} onChangeText={setSubject} maxLength={150} />
        <Field label="Message" value={body} onChangeText={setBody} multiline maxLength={5000} />
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Button title="Send" icon="send" onPress={send} loading={busy} />
      </Card>
    </Screen>
  );
}
