import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { createStore } from './createStore';
import type { AppStore } from './createStore';
import { useStore, type StoreApi } from './tinyStore';

let storeInstance: StoreApi<AppStore> | null = null;

function getStore(): StoreApi<AppStore> {
  if (!storeInstance) {
    storeInstance = createStore();
  }
  return storeInstance;
}

const StoreContext = createContext<StoreApi<AppStore> | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<StoreApi<AppStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = getStore();
  }
  const store = storeRef.current;
  useEffect(() => {
    store.getState().refresh();
  }, [store]);
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useAppStore<T>(selector: (s: AppStore) => T): T {
  const store = useContext(StoreContext) ?? getStore();
  return useStore(store, selector);
}

export function useStoreActions(): AppStore {
  const store = useContext(StoreContext) ?? getStore();
  return store.getState();
}
