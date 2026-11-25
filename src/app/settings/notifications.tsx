import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Linking, Switch, Text, View } from 'react-native';

import { Button, Card, Loading, Muted, Notice, Screen, SectionTitle } from '@/components/ui';
import { call, errorText } from '@/lib/api';
import { keys, usePrefs } from '@/lib/data';
import { pushPermission, registerForPush, type PushState } from '@/lib/push';
import { colors } from '@/lib/theme';

export default function NotificationSettings() {
  const qc = useQueryClient();
  const q = usePrefs();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [perm, setPerm] = useState<PushState | null>(null);
  const [error, setError] = useState('');
  const [test, setTest] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => { if (q.data) setPrefs(q.data.prefs); }, [q.data]);
  useEffect(() => { pushPermission().then(setPerm).catch(() => null); }, []);

  const toggle = async (key: string, on: boolean) => {
    setError('');
    const next = { ...prefs, [key]: on };
    setPrefs(next);
    try {
      await call('mobileApp', { action: 'savePreferences', prefs: { [key]: on } });
      qc.invalidateQueries({ queryKey: keys.prefs });
    } catch (e) {
      setPrefs(prefs);
      setError(errorText(e));
    }
  };

  const sendTest = async () => {
    setTest('');
    setTesting(true);
    try {
      const res = await call<{ pushed: number }>('mobileApp', { action: 'testPush' });
      setTest(res.pushed ? 'Sent. It should arrive in a few seconds.' : 'No phone is set up yet. Turn on notifications above first.');
      qc.invalidateQueries({ queryKey: keys.notifications });
    } catch (e) {
      setTest(errorText(e));
    } finally {
      setTesting(false);
    }
  };

  return (
    <Screen>
      {perm === 'denied' ? (
        <Notice tone="warn">Notifications are off for MyLivestockShow in your phone&apos;s settings. Turn them on to get alerts.</Notice>
      ) : null}
      {perm === 'denied' ? <Button title="Open phone settings" variant="secondary" onPress={() => Linking.openSettings()} /> : null}
      {perm === 'undetermined' ? <Button title="Turn on notifications" icon="notifications" onPress={async () => setPerm(await registerForPush({ ask: true }))} /> : null}
      {perm === 'unavailable' ? <Notice tone="info">Notifications only work on a real phone.</Notice> : null}

      <SectionTitle>Send me</SectionTitle>
      {q.isLoading ? <Loading /> : null}
      {q.data ? (
        <Card style={{ padding: 0 }}>
          {q.data.categories.map((c, i) => (
            <View key={c.key} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: i < q.data.categories.length - 1 ? 0.5 : 0, borderBottomColor: colors.line }}>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: colors.navy }}>{c.label}</Text>
              <Switch value={prefs[c.key] !== false} onValueChange={(v) => toggle(c.key, v)} trackColor={{ true: colors.navy, false: colors.line }} />
            </View>
          ))}
        </Card>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Muted>Everything still shows in your notification list; these switches only decide what alerts your phone.</Muted>
      <Button title="Send a test notification" variant="secondary" onPress={sendTest} loading={testing} />
      {test ? <Notice tone="info">{test}</Notice> : null}
    </Screen>
  );
}
