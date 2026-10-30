import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Updater<T> = T | ((prev: T) => T);

/** useState care se păstrează pe telefon (AsyncStorage). Obiectele salvate se completează cu câmpurile noi din `initial`. */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw == null) return;
        const saved = JSON.parse(raw);
        const isPlainObject = (x: unknown) => x !== null && typeof x === 'object' && !Array.isArray(x);
        setValue(isPlainObject(initial) && isPlainObject(saved) ? { ...initial, ...saved } : saved);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: Updater<T>) => {
      setValue((prev) => {
        const value = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
        return value;
      });
    },
    [key],
  );

  return [value, update, loaded] as const;
}

export function dateKey(date = new Date()) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}
