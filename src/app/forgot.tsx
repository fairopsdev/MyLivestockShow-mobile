import { router } from 'expo-router';
import { useState } from 'react';

import { Button, Card, Field, Muted, Notice, Screen } from '@/components/ui';
import { auth, errorText } from '@/lib/api';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter the email you sign in with.');
    setBusy(true);
    try {
      await auth.resetRequest(email.trim().toLowerCase());
      setSent(true);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Card>
        {sent ? (
          <>
            <Notice tone="success">If {email.trim()} has a Fair Central account, a reset link is on its way.</Notice>
            <Muted>Open the link in the email, choose a new password, then come back and sign in.</Muted>
            <Button title="Back to sign in" onPress={() => router.back()} />
          </>
        ) : (
          <>
            <Muted>Enter your email and we&apos;ll send you a link to choose a new password.</Muted>
            <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            {error ? <Notice tone="error">{error}</Notice> : null}
            <Button title="Send reset link" onPress={send} loading={busy} />
          </>
        )}
      </Card>
    </Screen>
  );
}
