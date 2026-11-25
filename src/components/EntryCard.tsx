import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Badge, Card, Muted } from '@/components/ui';
import { entryTitle, entryTone, weightTone } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { Entry } from '@/lib/types';

export function EntryCard({ entry: e }: { entry: Entry }) {
  const tone = entryTone(e.status);
  const showWeight = e.weight_status && e.weight_status !== 'not_weighed';
  const w = weightTone(e.weight_status || 'not_weighed');
  return (
    <Card onPress={() => router.push({ pathname: '/entry/[id]', params: { id: e.id } })}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: colors.navy, flex: 1 }} numberOfLines={1}>{entryTitle(e)}</Text>
        {e.entry_number ? <Text style={{ fontWeight: '800', color: colors.muted }}>#{e.entry_number}</Text> : null}
      </View>
      <Muted numberOfLines={2}>{[e.class_name, e.department_name].filter(Boolean).join(' · ')}{e.exhibitor_name && e.animal_name ? ` · ${e.exhibitor_name}` : ''}</Muted>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        <Badge label={tone.label} fg={tone.fg} bg={tone.bg} />
        {showWeight ? <Badge label={`${e.weight ?? ''} lb · ${w.label}`} fg={w.fg} bg={w.bg} /> : null}
      </View>
    </Card>
  );
}
