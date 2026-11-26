import { Redirect } from 'expo-router';

// Fair Central's sign-in page returns here (<scheme>://auth?code=…). The sign-in
// screen that opened the browser finishes signing in; this just leaves the
// address so it never shows as an unknown page.
export default function AuthReturn() {
  return <Redirect href="/" />;
}
