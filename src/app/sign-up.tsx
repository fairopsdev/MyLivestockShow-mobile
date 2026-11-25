import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Text } from 'react-native';

import { Button, Card, Field, Muted, Notice, Screen } from '@/components/ui';
import { auth, errorText } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { WEB_URL } from '@/lib/config';
import { colors } from '@/lib/theme';

export default function SignUp() {
  const { confirmSignUp } = useAuth();
  const [step, setStep] = useState<'details' | 'code'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const register = async () => {
    setError('');
    if (!name.trim()) return setError('Enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    if (password !== confirm) return setError('The passwords do not match.');
    setBusy(true);
    try {
      await auth.register(email.trim().toLowerCase(), password);
      setStep('code');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError('');
    if (!code.trim()) return setError('Enter the code from your email.');
    setBusy(true);
    try {
      await confirmSignUp(email, code, name);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    try {
      await auth.resendOtp(email.trim().toLowerCase());
      setInfo('We sent a new code.');
    } catch (e) {
      setError(errorText(e));
    }
  };

  if (step === 'code') {
    return (
      <Screen>
        <Card>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy }}>Check your email</Text>
          <Muted>We sent a code to {email.trim()}. Enter it to finish creating your account.</Muted>
          <Field label="Code" value={code} onChangeText={setCode} keyboardType="number-pad" autoComplete="one-time-code"
            textContentType="oneTimeCode" onSubmitEditing={verify} />
          {error ? <Notice tone="error">{error}</Notice> : null}
          {info ? <Notice tone="success">{info}</Notice> : null}
          <Button title="Verify and continue" onPress={verify} loading={busy} />
          <Button title="Send a new code" variant="ghost" onPress={resend} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Muted>One Fair Central account works at every fair, on the web and in this app.</Muted>
        <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
          autoComplete="email" textContentType="emailAddress" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password"
          textContentType="newPassword" hint="At least 8 characters." />
        <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry textContentType="newPassword" />
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Button title="Create account" onPress={register} loading={busy} />
        <Muted style={{ textAlign: 'center' }}>
          By creating an account you agree to Fair Central&apos;s{' '}
          <Text style={{ color: colors.navy, fontWeight: '700' }} onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/terms`)}>terms</Text>
          {' '}and{' '}
          <Text style={{ color: colors.navy, fontWeight: '700' }} onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/privacy`)}>privacy policy</Text>.
        </Muted>
      </Card>
    </Screen>
  );
}
