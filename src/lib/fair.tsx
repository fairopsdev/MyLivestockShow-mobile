import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAccount } from './data';
import type { Fair } from './types';

// The fair the Ring and Results tabs show. Defaults to the person's most
// recent fair and is remembered on the phone.

const KEY = 'current-fair';
type FairValue = { fairs: Fair[]; fair: Fair | null; setFairId: (id: string) => void };
const FairContext = createContext<FairValue>({ fairs: [], fair: null, setFairId: () => {} });

export function FairProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const account = useAccount(enabled);
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(KEY).then((v) => v && setChosen(v)).catch(() => null);
  }, []);

  const value = useMemo<FairValue>(() => {
    const fairs = [...(account.data?.fairs || [])];
    // Most recent activity first: the fair of the newest entry.
    const latest = account.data?.entries?.[0]?.organization_id;
    const fair = fairs.find((f) => f.id === chosen) || fairs.find((f) => f.id === latest) || fairs[0] || null;
    return {
      fairs,
      fair,
      setFairId: (id: string) => {
        setChosen(id);
        SecureStore.setItemAsync(KEY, id).catch(() => null);
      },
    };
  }, [account.data, chosen]);

  return <FairContext.Provider value={value}>{children}</FairContext.Provider>;
}

export const useCurrentFair = () => useContext(FairContext);
