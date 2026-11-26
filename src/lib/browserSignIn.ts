import * as WebBrowser from 'expo-web-browser';

import { call as callPublic } from './api';

// "Continue with Google" (or any other way the website signs people in): the
// app opens Fair Central's /app-sign-in page in a secure browser window. Once
// the person is signed in there, the page sends back a one-time code, which
// the app swaps (authHandoff) for a Fair Central session. One account works on
// the website and in every Fair Central app.

const SIGN_IN_URL = 'https://my.faircentral.app/app-sign-in';
const APP = 'mylivestockshow';
const SCHEME = 'mylivestockshow';

WebBrowser.maybeCompleteAuthSession();

function codeFrom(url: string, key: string) {
  const m = url.match(new RegExp(`[?#&]${key}=([A-Za-z0-9_-]+)`));
  return m ? decodeURIComponent(m[1]) : '';
}

/** The session token, or null if the person closed the window. */
export async function signInWithBrowser(): Promise<string | null> {
  const res = await WebBrowser.openAuthSessionAsync(`${SIGN_IN_URL}?app=${APP}`, `${SCHEME}://auth`);
  if (res.type !== 'success' || !res.url) return null;
  const code = codeFrom(res.url, 'code');
  if (!code) throw new Error("Sign-in didn't finish. Try again.");
  const out = await callPublic<{ access_token: string }>('authHandoff', { action: 'redeem', code, target: `app:${SCHEME}` });
  return out.access_token;
}
