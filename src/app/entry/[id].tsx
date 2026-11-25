import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Badge, Button, Card, Loading, Muted, Notice, Row, Screen, SectionTitle } from '@/components/ui';
import { call, errorText } from '@/lib/api';
import { keys, useAccount, useFair } from '@/lib/data';
import { date, entryTitle, entryTone, money, placingText, weightTone } from '@/lib/format';
import { colors } from '@/lib/theme';

export default function EntryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const account = useAccount();
  const base = account.data?.entries.find((e) => e.id === id);
  const fair = useFair(base?.organization_id);
  const detailed = fair.data?.entries.find((e) => e.id === id);
  const e = detailed || base;
  const fairName = account.data?.fairs.find((f) => f.id === e?.organization_id)?.name || '';
  const [busy, setBusy] = useState(false);

  if (account.isLoading) return <Loading />;
  if (!e) {
    return (
      <Screen>
        <Notice tone="warn">This entry isn&apos;t on your account any more. It may have been removed from your cart.</Notice>
      </Screen>
    );
  }

  const tone = entryTone(e.status);
  const w = weightTone(e.weight_status || 'not_weighed');
  const fee = Number(e.total_fee ?? e.entry_fee ?? 0);

  const remove = () =>
    Alert.alert('Remove from cart?', `${entryTitle(e)} will be taken out of your cart.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          setBusy(true);
          try {
            await call('exhibitorPortal', { action: 'removeCartEntry', entry_id: e.id });
            await qc.invalidateQueries({ queryKey: keys.account });
            router.back();
          } catch (err) {
            Alert.alert('Could not remove it', errorText(err));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  return (
    <Screen refreshing={account.isRefetching || fair.isRefetching} onRefresh={() => { account.refetch(); fair.refetch(); }}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.navy, flex: 1 }}>{entryTitle(e)}</Text>
          {e.entry_number ? <Text style={{ fontSize: 18, fontWeight: '800', color: colors.muted }}>#{e.entry_number}</Text> : null}
        </View>
        <Badge label={tone.label} fg={tone.fg} bg={tone.bg} />
        {e.status === 'needs_correction' ? (
          <Notice tone="error">{e.admin_notes || 'The show office asked for a change to this entry.'} Message the show office to sort it out.</Notice>
        ) : null}
      </Card>

      {e.result ? (
        <Card style={{ backgroundColor: colors.goldSoft, borderColor: colors.gold }}>
          <Text style={{ fontSize: 13, fontWeight: '800', letterSpacing: 1, color: colors.navy }}>RESULT</Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.navy }}>{placingText(e.result)}</Text>
          {e.result.premium ? <Muted>Premium {money(e.result.premium)}</Muted> : null}
          {e.result.comments ? <Muted>{e.result.comments}</Muted> : null}
        </Card>
      ) : null}

      <SectionTitle>Details</SectionTitle>
      <Card style={{ padding: 0 }}>
        <Row title="Show" subtitle={[e.show_name, fairName].filter(Boolean).join(' · ')} />
        <Row title="Class" subtitle={[e.class_name, e.division_name, e.department_name].filter(Boolean).join(' · ') || 'Not set'} />
        {e.exhibitor_name ? <Row title="Exhibitor" subtitle={e.exhibitor_name} /> : null}
        {e.animal_name ? <Row title="Animal" subtitle={e.animal_name} /> : null}
        <Row title="Entered" subtitle={date(e.created_date)} last={!e.check_in_date} />
        {e.check_in_date ? <Row title="Checked in" subtitle={date(e.check_in_date)} last /> : null}
      </Card>

      <SectionTitle>Weight</SectionTitle>
      <Card onPress={() => router.navigate('/weigh-in')}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.navy }}>{e.weight != null ? `${e.weight} lb` : '—'}</Text>
          <Badge label={w.label} fg={w.fg} bg={w.bg} />
        </View>
        <Muted>Tap to open weigh-in.</Muted>
      </Card>

      <SectionTitle>Fees</SectionTitle>
      <Card style={{ padding: 0 }}>
        <Row title="Entry fee" right={<Text style={{ fontWeight: '700', color: colors.navy }}>{money(fee)}</Text>} last={!e.late_fee && !e.payment} />
        {e.late_fee ? <Row title="Includes late fee" right={<Text style={{ color: colors.amber, fontWeight: '700' }}>{money(e.late_fee)}</Text>} last={!e.payment} /> : null}
        {e.payment ? (
          <Row title={e.payment.status === 'paid' ? 'Paid' : e.payment.method === 'pay_at_check_in' ? 'Pay at check-in' : 'Payment'}
            subtitle={e.payment.order_number ? `Order ${e.payment.order_number}` : undefined}
            right={<Text style={{ fontWeight: '700', color: e.payment.status === 'paid' ? colors.green : colors.amber }}>{money(e.payment.amount_paid || e.payment.total)}</Text>} last />
        ) : null}
      </Card>

      <View style={{ gap: 8, marginTop: 8 }}>
        {e.status === 'cart' ? (
          <>
            <Button title="Go to cart" icon="cart" onPress={() => router.push('/cart')} />
            <Button title="Remove from cart" variant="danger" onPress={remove} loading={busy} />
          </>
        ) : null}
        <Button title="Message the show office" variant="secondary" icon="chatbubble-ellipses"
          onPress={() => router.push({
            pathname: '/messages/new',
            params: { organization_id: e.organization_id, entry_id: e.id, show_id: e.show_id, subject: `Entry ${e.entry_number ? `#${e.entry_number}` : ''} ${entryTitle(e)}`.trim() },
          })} />
      </View>
    </Screen>
  );
}
