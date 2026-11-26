import { Link } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Field, Muted, Notice } from '@/components/ui';
import { errorText } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, space } from '@/lib/theme';

export default function SignIn() {
  const { signIn, signInWithBrowser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const withBrowser = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithBrowser();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setError('');
    if (!email.trim() || !password) return setError('Enter your email and password.');
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.navy }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
            <View style={s.brand}>
              <Image source={require('@/assets/images/icon.png')} style={s.logo} />
              <Text style={s.title}>MyLivestockShow</Text>
              <Text style={s.tag}>Entries, weights, the ring and your results — all in one place.</Text>
            </View>
            <View style={s.card}>
              <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email"
                keyboardType="email-address" textContentType="username" returnKeyType="next" />
              <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password"
                textContentType="password" returnKeyType="go" onSubmitEditing={submit} />
              {error ? <Notice tone="error">{error}</Notice> : null}
              <Button title="Sign in" onPress={submit} loading={busy} />
                <Text style={s.or}>or</Text>
                <Button title="Continue with Google" icon="logo-google" variant="secondary" onPress={withBrowser} disabled={busy} />
              <Link href="/forgot" style={s.link}>Forgot password?</Link>
            </View>
            <View style={{ alignItems: 'center', gap: space.sm }}>
              <Text style={s.muted}>New to Fair Central?</Text>
              <Link href="/sign-up" asChild>
                <Text style={s.cta}>Create an account</Text>
              </Link>
              <Muted style={{ color: '#AFC0DD', textAlign: 'center', marginTop: space.md }}>
                Use the same account you use on your fair&apos;s Fair Central website.
              </Muted>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  or: { color: colors.muted, textAlign: 'center', fontSize: 14, fontWeight: '600' },
  wrap: { flexGrow: 1, justifyContent: 'center', padding: space.xl, gap: space.xl },
  brand: { alignItems: 'center', gap: space.sm },
  logo: { width: 84, height: 84, borderRadius: 20 },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  tag: { color: '#D5DEEE', fontSize: 16, textAlign: 'center', lineHeight: 22 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: space.xl, gap: space.lg },
  link: { color: colors.navy, fontWeight: '700', textAlign: 'center', fontSize: 15 },
  muted: { color: '#D5DEEE', fontSize: 15 },
  cta: { color: colors.gold, fontSize: 17, fontWeight: '800' },
});
