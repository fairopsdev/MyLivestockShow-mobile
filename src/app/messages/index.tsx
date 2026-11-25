import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button, Card, Empty, Loading, Muted, Notice, Screen } from '@/components/ui';
import { errorText } from '@/lib/api';
import { useConversations } from '@/lib/data';
import { useCurrentFair } from '@/lib/fair';
import { ago } from '@/lib/format';
import { colors } from '@/lib/theme';

export default function Messages() {
  const q = useConversations();
  const { fair, fairs } = useCurrentFair();
  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      {fair ? (
        <Button title={`Message ${fair.name}`} icon="create" onPress={() => router.push({ pathname: '/messages/new', params: { organization_id: fair.id } })} />
      ) : fairs.length ? (
        <Button title="Message a show office" icon="create" onPress={() => router.push('/messages/new')} />
      ) : null}
      {q.isLoading ? <Loading /> : null}
      {q.error ? <Notice tone="error">{errorText(q.error)}</Notice> : null}
      {!q.isLoading && !q.data?.length ? (
        <Empty icon="chatbubbles-outline" title="No messages" body="Questions for the show office go here, and so do their replies." />
      ) : null}
      {q.data?.map((c) => (
        <Card key={c.id} onPress={() => router.push({ pathname: '/messages/[id]', params: { id: c.id } })}
          style={c.unread ? { borderColor: colors.gold, backgroundColor: '#FFFDF6' } : undefined}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {c.unread ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold }} /> : null}
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '800', color: colors.navy }} numberOfLines={1}>{c.subject}</Text>
            <Muted>{ago(c.last_activity_at)}</Muted>
          </View>
          <Muted numberOfLines={2}>{c.last_message_preview}</Muted>
          <Muted>{c.fair_name}{c.status === 'resolved' || c.status === 'closed' ? ' · Resolved' : ''}</Muted>
        </Card>
      ))}
    </Screen>
  );
}
