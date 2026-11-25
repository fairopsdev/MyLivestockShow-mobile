import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Card, Empty, Loading, Muted, Notice, Screen } from '@/components/ui';
import { call, errorText } from '@/lib/api';
import { keys, useNotifications } from '@/lib/data';
import { ago } from '@/lib/format';
import { openFromNotification } from '@/lib/links';
import { colors } from '@/lib/theme';

export default function NotificationsScreen() {
  const qc = useQueryClient();
  const q = useNotifications();
  const markAll = useMutation({
    mutationFn: () => call('mobileApp', { action: 'markRead', all: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.notifications });
      Notifications.setBadgeCountAsync(0).catch(() => null);
    },
  });
  const unread = q.data?.unread || 0;

  useEffect(() => {
    Notifications.setBadgeCountAsync(unread).catch(() => null);
  }, [unread]);

  const open = async (id: string, data: Record<string, string>) => {
    call('mobileApp', { action: 'markRead', ids: [id] }).then(() => qc.invalidateQueries({ queryKey: keys.notifications })).catch(() => null);
    if (data?.screen && data.screen !== 'notifications') openFromNotification(data);
  };

  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      {unread ? <Button title={`Mark all ${unread} as read`} variant="secondary" small onPress={() => markAll.mutate()} loading={markAll.isPending} /> : null}
      {q.isLoading ? <Loading /> : null}
      {q.error ? <Notice tone="error">{errorText(q.error)}</Notice> : null}
      {!q.isLoading && !q.data?.notifications.length ? (
        <Empty icon="notifications-outline" title="No notifications yet" body="Updates about your entries, weights, classes and results will show up here." />
      ) : null}
      {q.data?.notifications.map((n) => (
        <Pressable key={n.id} onPress={() => open(n.id, n.data)}>
          <Card style={!n.read ? { borderColor: colors.gold, backgroundColor: '#FFFDF6' } : undefined}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {!n.read ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold }} /> : null}
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '800', color: colors.navy }}>{n.title}</Text>
              <Muted>{ago(n.created_date)}</Muted>
            </View>
            {n.body ? <Muted>{n.body}</Muted> : null}
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
