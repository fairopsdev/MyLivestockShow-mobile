import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Loading, Muted, Notice } from '@/components/ui';
import { call, errorText } from '@/lib/api';
import { keys, useThread } from '@/lib/data';
import { dateTime } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';

export default function Thread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const qc = useQueryClient();
  const q = useThread(id);
  const insets = useSafeAreaInsets();
  const scroll = useRef<any>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (q.data?.conversation) {
      nav.setOptions({ title: q.data.conversation.fair_name || 'Conversation' });
      qc.invalidateQueries({ queryKey: keys.conversations });
    }
  }, [q.data?.conversation, nav, qc]);

  const send = async () => {
    if (!text.trim()) return;
    setError('');
    setBusy(true);
    try {
      await call('fairMessages', { action: 'myReply', id, body: text.trim() });
      setText('');
      await q.refetch();
      qc.invalidateQueries({ queryKey: keys.conversations });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  if (q.isLoading) return <Loading />;
  if (q.error) return <View style={{ padding: 16 }}><Notice tone="error">{errorText(q.error)}</Notice></View>;
  const conv = q.data!.conversation;
  const closed = ['resolved', 'closed'].includes(conv.status);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: space.lg, gap: space.md }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy }}>{conv.subject}</Text>
        {q.data!.messages.map((m) => {
          const me = m.author_type === 'requester';
          return (
            <View key={m.id} style={[s.bubble, me ? s.me : s.them]}>
              {!me ? <Text style={s.author}>{m.author_name || 'Show office'}</Text> : null}
              <Text style={{ color: me ? '#fff' : colors.text, fontSize: 16, lineHeight: 22 }}>{m.body}</Text>
              <Text style={[s.time, me && { color: '#C9D4E8' }]}>{dateTime(m.created_date)}</Text>
            </View>
          );
        })}
        {closed ? <Muted style={{ textAlign: 'center' }}>This conversation is resolved. Reply to open it again.</Muted> : null}
      </ScrollView>
      <View style={[s.composer, { paddingBottom: insets.bottom + space.sm }]}>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <TextInput value={text} onChangeText={setText} placeholder="Write a reply" placeholderTextColor={colors.faint} multiline style={s.input} />
        <Button title="Send" icon="send" onPress={send} loading={busy} disabled={!text.trim()} />
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  bubble: { maxWidth: '85%', padding: space.md, borderRadius: radius.lg, gap: 4 },
  me: { alignSelf: 'flex-end', backgroundColor: colors.navy, borderBottomRightRadius: 4 },
  them: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 4 },
  author: { fontSize: 13, fontWeight: '800', color: colors.navy },
  time: { fontSize: 12, color: colors.faint },
  composer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.line, padding: space.md, gap: space.sm },
  input: { minHeight: 44, maxHeight: 140, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: space.md, fontSize: 16, color: colors.text },
});
