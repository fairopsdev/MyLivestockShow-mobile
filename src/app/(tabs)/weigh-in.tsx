import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Badge, Button, Card, Empty, Field, Loading, Muted, Notice, Screen, SectionTitle } from '@/components/ui';
import { call, errorText } from '@/lib/api';
import { keys, useWeighIn } from '@/lib/data';
import { dateTime, entryTitle, weightTone } from '@/lib/format';
import { colors, radius } from '@/lib/theme';
import type { WeighEntry } from '@/lib/types';
import { uploadPrivate } from '@/lib/upload';

export default function WeighIn() {
  const q = useWeighIn();
  const groups = useMemo(() => {
    const map = new Map<string, { title: string; items: WeighEntry[] }>();
    for (const e of q.data || []) {
      const g = map.get(e.show_id) || { title: e.show_name || 'Show', items: [] };
      g.items.push(e);
      map.set(e.show_id, g);
    }
    return [...map.values()];
  }, [q.data]);

  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      {q.isLoading ? <Loading /> : null}
      {q.error ? <Notice tone="error">{errorText(q.error)}</Notice> : null}
      {!q.isLoading && !groups.length ? (
        <Empty icon="speedometer-outline" title="Nothing to weigh"
          body="When a show you're entered in takes weights, your entries show up here so you can submit them." />
      ) : null}
      {groups.map((g) => (
        <View key={g.title} style={{ gap: 8 }}>
          <SectionTitle>{g.title}</SectionTitle>
          {g.items.map((e) => <WeighCard key={e.id} entry={e} />)}
        </View>
      ))}
    </Screen>
  );
}

function WeighCard({ entry: e }: { entry: WeighEntry }) {
  const qc = useQueryClient();
  const [weight, setWeight] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const tone = weightTone(e.weight_status);
  const has = e.weight != null && !['not_weighed', 'voided'].includes(e.weight_status);
  const canChange = !has || e.allow_changes;
  const needPhoto = !!e.open_window?.require_photo && !e.has_photo;
  const unit = e.weight_unit || 'lbs';

  const pick = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', camera ? 'Allow camera access to take a photo of the scale.' : 'Allow photo access to choose a photo of the scale.');
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsEditing: false };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets[0]) setPhoto(res.assets[0]);
  };

  const submit = async () => {
    setError('');
    setDone('');
    const n = Number(weight.replace(',', '.'));
    if (!weight.trim() || !Number.isFinite(n) || n <= 0) return setError('Enter the weight from the scale.');
    if (!e.allow_decimals && !Number.isInteger(n)) return setError('Enter a whole number.');
    if (e.min_weight != null && n < e.min_weight) return setError(`The lowest weight this show takes is ${e.min_weight} ${unit}.`);
    if (e.max_weight != null && n > e.max_weight) return setError(`The highest weight this show takes is ${e.max_weight} ${unit}.`);
    if (needPhoto && !photo) return setError('Add a photo of the scale showing the weight.');
    setBusy(true);
    try {
      let photoUri: string | undefined;
      if (photo) {
        photoUri = await uploadPrivate({
          uri: photo.uri, name: photo.fileName || `scale-${e.entry_number || e.id}.jpg`, type: photo.mimeType || 'image/jpeg',
        });
      }
      await call('entryWeighIn', { action: 'submit', entryId: e.id, weight: n, photo: photoUri });
      setWeight('');
      setPhoto(null);
      setDone(`${n} ${unit} sent. The show office makes it official.`);
      qc.invalidateQueries({ queryKey: keys.weighIn });
      qc.invalidateQueries({ queryKey: keys.account });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: colors.navy, flex: 1 }}>{entryTitle(e)}</Text>
        {e.entry_number ? <Text style={{ fontWeight: '800', color: colors.muted }}>#{e.entry_number}</Text> : null}
      </View>
      <Muted>{[e.class_code, e.class_name].filter(Boolean).join(' ')}{e.exhibitor_name && e.animal_name ? ` · ${e.exhibitor_name}` : ''}</Muted>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {has ? <Text style={{ fontSize: 22, fontWeight: '800', color: colors.navy }}>{e.weight} {unit}</Text> : null}
        <Badge label={tone.label} fg={tone.fg} bg={tone.bg} />
      </View>

      {e.can_submit_now ? (
        canChange ? (
          <View style={{ gap: 10, marginTop: 4 }}>
            {e.open_window ? <Muted>Weigh-in closes {dateTime(e.open_window.closes_at)}.</Muted> : null}
            {e.open_window?.instructions || e.instructions ? <Notice tone="info">{e.open_window?.instructions || e.instructions}</Notice> : null}
            <Field label={has ? `Change weight (${unit})` : `Weight (${unit})`} value={weight} onChangeText={setWeight}
              keyboardType={e.allow_decimals ? 'decimal-pad' : 'number-pad'} placeholder={e.min_weight ? `${e.min_weight}–${e.max_weight ?? ''}` : undefined} />
            {photo ? (
              <View style={{ gap: 6 }}>
                <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 180, borderRadius: radius.md }} contentFit="cover" />
                <Button title="Remove photo" variant="ghost" small onPress={() => setPhoto(null)} />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}><Button title="Take photo" icon="camera" variant="secondary" small onPress={() => pick(true)} /></View>
                <View style={{ flex: 1 }}><Button title="Choose photo" icon="images" variant="secondary" small onPress={() => pick(false)} /></View>
              </View>
            )}
            {needPhoto ? <Muted>A photo of the scale is required.</Muted> : null}
            {error ? <Notice tone="error">{error}</Notice> : null}
            {done ? <Notice tone="success">{done}</Notice> : null}
            <Button title={has ? 'Update weight' : 'Submit weight'} onPress={submit} loading={busy} />
          </View>
        ) : (
          <Muted>Your weight is in. Contact the show office to change it.</Muted>
        )
      ) : e.next_window ? (
        <Notice tone="info">Weigh-in opens {dateTime(e.next_window.opens_at)}.</Notice>
      ) : !has ? (
        <Muted>Weigh-in isn&apos;t open for this entry.</Muted>
      ) : null}
    </Card>
  );
}
