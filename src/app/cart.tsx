import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Button, Card, Empty, Loading, Muted, Notice, Screen, SectionTitle, Segmented } from '@/components/ui';
import { call, errorText } from '@/lib/api';
import { keys, useAccount, useFair } from '@/lib/data';
import { entryTitle, money } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { Entry } from '@/lib/types';

// Entries waiting to be sent, one show per checkout (as on the website).
export default function Cart() {
  const account = useAccount();
  const cart = (account.data?.entries || []).filter((e) => e.status === 'cart');
  const groups = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of cart) map.set(e.show_id, [...(map.get(e.show_id) || []), e]);
    return [...map.values()];
  }, [cart]);

  if (account.isLoading) return <Loading />;
  return (
    <Screen refreshing={account.isRefetching} onRefresh={() => account.refetch()}>
      {!groups.length ? (
        <Empty icon="cart-outline" title="Your cart is empty" body="Entries you add go here until you check out."
          action={<Button title="Enter a show" icon="add" onPress={() => router.replace('/enter')} />} />
      ) : null}
      {groups.map((items) => <ShowCart key={items[0].show_id} items={items} />)}
    </Screen>
  );
}

function ShowCart({ items }: { items: Entry[] }) {
  const qc = useQueryClient();
  const fair = useFair(items[0].organization_id);
  const show = fair.data?.shows.find((s) => s.id === items[0].show_id);
  const [agree, setAgree] = useState(false);
  const [method, setMethod] = useState<'card' | 'pay_at_check_in'>('card');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const total = items.reduce((s, e) => s + Number(e.total_fee ?? e.entry_fee ?? 0), 0);
  const policy = (show?.entry_refund_policy || '').trim();
  const card = show?.entry_payment_online !== false;
  const atCheckIn = !!show?.entry_pay_at_check_in;
  const pay = card && atCheckIn ? method : card ? 'card' : 'pay_at_check_in';

  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: keys.account }),
    qc.invalidateQueries({ queryKey: keys.fair(items[0].organization_id) }),
  ]);

  const remove = async (e: Entry) => {
    try {
      await call('exhibitorPortal', { action: 'removeCartEntry', entry_id: e.id });
      await refresh();
    } catch (err) {
      Alert.alert('Could not remove it', errorText(err));
    }
  };

  const checkout = async () => {
    setError('');
    if (policy && !agree) return setError("Please agree to the show's entry rules and refund policy.");
    setBusy(true);
    try {
      const res = await call<{ url: string | null; session_id?: string; free?: boolean; pay_at_check_in?: boolean }>('entryCheckout', {
        action: 'create', entry_ids: items.map((e) => e.id), refund_policy_acknowledged: agree || !policy,
        payment_method: total > 0 ? pay : undefined,
      });
      if (res.url) {
        await WebBrowser.openBrowserAsync(res.url, { dismissButtonStyle: 'done' });
        // Back from Stripe: confirm the payment (the fair's webhook does it too).
        if (res.session_id) {
          try {
            await call('entryCheckout', { action: 'confirm', session_id: res.session_id });
            Alert.alert('Paid', 'Your entries are on their way to the show office.');
          } catch {
            setError('Payment not finished. Tap Check out to try again.');
          }
        }
      } else {
        Alert.alert('Entries sent', res.free ? 'Your entries are on their way to the show office.' : 'Your entries are on their way. Pay at check-in.');
      }
      await refresh();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>{items[0].show_name || show?.name || 'Show'}</SectionTitle>
      <Card style={{ padding: 0 }}>
        {items.map((e) => (
          <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 0.5, borderBottomColor: colors.line }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.navy, fontSize: 16 }}>{entryTitle(e)}</Text>
              <Muted>{[e.class_name, e.exhibitor_name].filter(Boolean).join(' · ')}{e.late_fee ? ' · late fee' : ''}</Muted>
            </View>
            <Text style={{ fontWeight: '700', color: colors.navy }}>{money(e.total_fee ?? e.entry_fee)}</Text>
            <Pressable onPress={() => remove(e)} hitSlop={10} accessibilityLabel="Remove from cart">
              <Ionicons name="close-circle" size={22} color={colors.faint} />
            </Pressable>
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14 }}>
          <Text style={{ fontWeight: '800', fontSize: 17, color: colors.navy }}>Total</Text>
          <Text style={{ fontWeight: '800', fontSize: 17, color: colors.navy }}>{money(total)}</Text>
        </View>
      </Card>
      {total > 0 && card && atCheckIn ? (
        <Segmented value={method} onChange={setMethod} options={[{ value: 'card', label: 'Pay by card' }, { value: 'pay_at_check_in', label: 'Pay at check-in' }]} />
      ) : null}
      {policy ? (
        <Card>
          <Text style={{ fontWeight: '800', color: colors.navy }}>Entry rules and refund policy</Text>
          <Muted>{policy}</Muted>
          <Pressable onPress={() => setAgree(!agree)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 6 }}>
            <Ionicons name={agree ? 'checkbox' : 'square-outline'} size={24} color={colors.navy} />
            <Text style={{ flex: 1, color: colors.navy, fontWeight: '600' }}>I agree to the show&apos;s entry rules and refund policy</Text>
          </Pressable>
        </Card>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button title={total > 0 && pay === 'card' ? `Check out · ${money(total)}` : 'Send entries'} icon="lock-closed" onPress={checkout} loading={busy} />
      {total > 0 && pay === 'card' ? <Muted style={{ textAlign: 'center' }}>Card payment opens securely in Stripe.</Muted> : null}
    </View>
  );
}
