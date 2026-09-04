import { useReducer, useRef, useEffect } from 'react';

/**
 * Minimal store implementation (no external dependency).
 * Provides get/set and a React hook for subscribing.
 */
export interface StoreApi<T> {
  getState: () => T;
  setState: (partial: Partial<T> | ((s: T) => Partial<T>)) => void;
  subscribe: (listener: () => void) => () => void;
}

export function create<T>(initializer: (set: (partial: Partial<T> | ((s: T) => Partial<T>)) => void, get: () => T) => T): StoreApi<T> {
  let state: T;
  const listeners = new Set<() => void>();

  const setState = (partial: Partial<T> | ((s: T) => Partial<T>)) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  };
  const getState = () => state;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = initializer(setState, getState);
  return { getState, setState, subscribe };
}

function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
  }
  return true;
}

/**
 * Subscribe to a store slice. Re-renders only when the selected value changes
 * by shallow equality. Does NOT use useSyncExternalStore (which requires
 * referentially stable snapshots and breaks with inline object selectors).
 */
export function useStore<T, U>(store: StoreApi<T>, selector: (state: T) => U): U {
  const [, forceRender] = useReducer((c: number) => c + 1, 0);
  const selectedRef = useRef<U>(selector(store.getState()));
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  useEffect(() => {
    const check = () => {
      const next = selectorRef.current(store.getState());
      if (!shallowEqual(selectedRef.current, next)) {
        selectedRef.current = next;
        forceRender();
      }
    };
    return store.subscribe(check);
  }, [store]);

  // Always return the latest value from the store in case state changed
  // before the effect re-ran
  const latest = selector(store.getState());
  if (!shallowEqual(selectedRef.current, latest)) {
    selectedRef.current = latest;
  }
  return selectedRef.current;
}
