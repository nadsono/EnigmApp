import { useMemo, useState } from 'react';
import { normalizeOperationPreferences, type OperationPreferences } from '../domain/operationCapital.ts';

const storageKey = (userId: string) => `enigma.operation-preferences.v1.${encodeURIComponent(userId)}`;

function readPreferences(userId: string): OperationPreferences {
  try {
    return normalizeOperationPreferences(JSON.parse(localStorage.getItem(storageKey(userId)) || 'null'));
  } catch {
    return normalizeOperationPreferences(null);
  }
}

export function useOperationPreferences(userId: string) {
  const loaded = useMemo(() => readPreferences(userId), [userId]);
  const [state, setState] = useState({ userId, preferences: loaded });
  const preferences = state.userId === userId ? state.preferences : loaded;
  const [storageError, setStorageError] = useState(false);

  const setPreferences = (patch: Partial<OperationPreferences>) => {
    const next = normalizeOperationPreferences({ ...preferences, ...patch });
    setState({ userId, preferences: next });
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  };
  return { preferences, setPreferences, storageError };
}
