import * as SecureStore from 'expo-secure-store';

import { API_URL, APP_ID, WEB_URL } from './config';

// A small client for Fair Central. The app talks to the same backend
// functions as the website, signed in with the same Fair Central account.

const TOKEN_KEY = 'fair-central-token';
let token: string | null = null;
let onSignedOut: (() => void) | null = null;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function setSignedOutHandler(handler: (() => void) | null) {
  onSignedOut = handler;
}

export async function loadToken() {
  token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token;
}

export async function saveToken(next: string | null) {
  token = next;
  if (next) await SecureStore.setItemAsync(TOKEN_KEY, next);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

function messageFrom(data: any, status: number) {
  const e = data?.error;
  return (typeof e === 'string' && e) || e?.message || data?.message || data?.detail || `Something went wrong (${status}).`;
}

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const hadToken = !!token;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/apps/${APP_ID}${path}`, {
      method: init.method || 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-App-Id': APP_ID,
        'X-Base44-App-Url': WEB_URL,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError('No connection. Check your signal and try again.', 0);
  }
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    if (res.status === 401 && hadToken) onSignedOut?.();
    throw new ApiError(messageFrom(data, res.status), res.status);
  }
  if (data && typeof data === 'object' && typeof data.error === 'string' && data.error) {
    throw new ApiError(data.error, res.status);
  }
  return data as T;
}

/** Call a Fair Central backend function. */
export function call<T = any>(name: string, payload: Record<string, unknown> = {}) {
  return request<T>(`/functions/${name}`, { method: 'POST', body: payload });
}

export type AccountUser = { id: string; email: string; full_name?: string };

export const auth = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user?: AccountUser }>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (email: string, password: string) => request('/auth/register', { method: 'POST', body: { email, password } }),
  verifyOtp: (email: string, code: string) =>
    request<{ access_token?: string }>('/auth/verify-otp', { method: 'POST', body: { email, otp_code: code } }),
  resendOtp: (email: string) => request('/auth/resend-otp', { method: 'POST', body: { email } }),
  resetRequest: (email: string) => request('/auth/reset-password-request', { method: 'POST', body: { email } }),
  me: () => request<AccountUser>('/entities/User/me'),
  updateMe: (data: Record<string, unknown>) => request<AccountUser>('/entities/User/me', { method: 'PUT', body: data }),
};

export function errorText(e: unknown) {
  return e instanceof Error ? e.message : 'Something went wrong.';
}
