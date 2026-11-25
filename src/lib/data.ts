import { useQueries, useQuery } from '@tanstack/react-query';

import { call } from './api';
import type {
  Account, AppNotification, Conversation, FairData, Message, RingData, SignDoc, WeighEntry,
} from './types';

// Every screen reads through these hooks so pull-to-refresh and the
// invalidation after a change are the same everywhere.

export const keys = {
  account: ['account'] as const,
  fair: (id: string) => ['fair', id] as const,
  wizard: (showId: string) => ['wizard', showId] as const,
  weighIn: ['weigh-in'] as const,
  ring: (id: string) => ['ring', id] as const,
  results: (id: string) => ['results', id] as const,
  notifications: ['notifications'] as const,
  conversations: ['conversations'] as const,
  thread: (id: string) => ['thread', id] as const,
  documents: ['documents'] as const,
  prefs: ['prefs'] as const,
  profile: ['profile'] as const,
};

export const useAccount = (enabled = true) =>
  useQuery({ queryKey: keys.account, enabled, queryFn: () => call<Account>('exhibitorPortal', { action: 'account' }) });

export const useFair = (organizationId?: string | null) =>
  useQuery({
    queryKey: keys.fair(organizationId || ''),
    enabled: !!organizationId,
    queryFn: () => call<FairData>('exhibitorPortal', { action: 'fair', organization_id: organizationId }),
  });

export const useWeighIn = () =>
  useQuery({
    queryKey: keys.weighIn,
    queryFn: async () => (await call<{ entries: WeighEntry[] }>('entryWeighIn', { action: 'myEntries' })).entries || [],
  });

export const useRing = (organizationId?: string | null) =>
  useQuery({
    queryKey: keys.ring(organizationId || ''),
    enabled: !!organizationId,
    refetchInterval: 20_000,
    queryFn: () => call<RingData>('mobileApp', { action: 'myRing', organization_id: organizationId }),
  });

export const useFairResults = (organizationId?: string | null) =>
  useQuery({
    queryKey: keys.results(organizationId || ''),
    enabled: !!organizationId,
    queryFn: () => call<{ results: any[]; shows: { id: string; name: string }[] }>('exhibitorPortal', { action: 'results', organization_id: organizationId }),
  });

export const useNotifications = () =>
  useQuery({
    queryKey: keys.notifications,
    queryFn: () => call<{ notifications: AppNotification[]; unread: number }>('mobileApp', { action: 'notifications', limit: 60 }),
  });

export const useConversations = () =>
  useQuery({
    queryKey: keys.conversations,
    queryFn: async () => (await call<{ conversations: Conversation[] }>('fairMessages', { action: 'mine' })).conversations || [],
  });

export const useThread = (id: string) =>
  useQuery({
    queryKey: keys.thread(id),
    enabled: !!id,
    refetchInterval: 30_000,
    queryFn: () => call<{ conversation: Conversation; messages: Message[] }>('fairMessages', { action: 'myThread', id }),
  });

export const useDocuments = () =>
  useQuery({
    queryKey: keys.documents,
    queryFn: async () => (await call<{ documents: SignDoc[] }>('signatures', { action: 'mine' })).documents || [],
  });

export const usePrefs = () =>
  useQuery({
    queryKey: keys.prefs,
    queryFn: () => call<{ prefs: Record<string, boolean>; categories: { key: string; label: string }[] }>('mobileApp', { action: 'preferences' }),
  });

export const useProfile = () =>
  useQuery({ queryKey: keys.profile, queryFn: () => call<any>('exhibitorPortal', { action: 'profile' }) });

// Several fairs at once (the "All my fairs" view).
export const useFairsData = (ids: string[]) =>
  useQueries({
    queries: ids.map((id) => ({
      queryKey: keys.fair(id),
      queryFn: () => call<FairData>('exhibitorPortal', { action: 'fair', organization_id: id }),
    })),
  });

export const useRings = (ids: string[]) =>
  useQueries({
    queries: ids.map((id) => ({
      queryKey: keys.ring(id),
      refetchInterval: 20_000,
      queryFn: () => call<RingData>('mobileApp', { action: 'myRing', organization_id: id }),
    })),
  });
