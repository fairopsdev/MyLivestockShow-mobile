import { useState } from 'react';
import { Platform } from 'react-native';

import { Button, Card, Field, Muted, Notice, Screen } from '@/components/ui';
import { call, errorText } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function DeleteAccount() {
  const { signOut, user } = useAuth();
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const submit = async () => {
    setError('');
    if (confirm.trim().toUpperCase() !== 'DELETE') return setError('Type DELETE to confirm.');
    setBusy(true);
    try {
      const res = await call<{ ticket_number?: string }>('mobileApp', { action: 'requestDeletion', reason, source: Platform.OS === 'android' ? 'android' : 'ios' });
      setDone(`Your request is in${res.ticket_number ? ` (${res.ticket_number})` : ''}. Fair Central will delete your account and email ${user?.email} when it's done.`);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Screen>
        <Notice tone="success">{done}</Notice>
        <Button title="Sign out" onPress={() => signOut()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Muted>
          This deletes your Fair Central account: your sign-in, profile, saved animals and notifications, on the web and in this app.
          Entries, payments and results you sent to a fair stay with that fair, as its records require.
        </Muted>
        <Field label="Why are you leaving? (optional)" value={reason} onChangeText={setReason} multiline />
        <Field label="Type DELETE to confirm" value={confirm} onChangeText={setConfirm} autoCapitalize="characters" />
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Button title="Delete my account" variant="danger" onPress={submit} loading={busy} />
      </Card>
    </Screen>
  );
}
