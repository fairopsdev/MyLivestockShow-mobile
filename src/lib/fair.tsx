import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAccount } from './data';
import type { Fair } from './types';

// Which fairs Home, the Ring and Results show. With more than one fair the
// default is all of them together; the person can narrow it to one fair.
// The choice is remembered on the phone.

const KEY = 'current-fair';
export const ALL = 'all';

type FairValue = {
  fairs: Fair[];          // every fair the account is linked to
  fair: Fair | null;      // the one chosen fair, or null when showing all
  scope: Fair[];          // the fairs being shown right now
  allMode: boolean;
  setFairId: (id: string) => void; // a fair's id, or ALL
};
const FairContext = createContext<FairValue>({ fairs: [], fair: null, scope: [], allMode: false, setFairId: () => {} });

export function FairProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const account = useAccount(enabled);
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(KEY).then((v) => v && setChosen(v)).catch(() => null);
  }, []);

  const value = useMemo<FairValue>(() => {
    const fairs = [...(account.data?.fairs || [])];
    const picked = chosen && chosen !== ALL ? fairs.find((f) => f.id === chosen) || null : null;
    const allMode = !picked && fairs.length > 1;
    const fair = picked || (fairs.length === 1 ? fairs[0] : null);
    return {
      fairs,
      fair,
      scope: allMode ? fairs : fair ? [fair] : [],
      allMode,
      setFairId: (id: string) => {
        setChosen(id);
        SecureStore.setItemAsync(KEY, id).catch(() => null);
      },
    };
  }, [account.data, chosen]);

  return <FairContext.Provider value={value}>{children}</FairContext.Provider>;
}

export const useCurrentFair = () => useContext(FairContext);
