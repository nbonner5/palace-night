import { useCallback, useEffect, useState } from 'react';
import { storage } from './storage';

const STORAGE_KEY = 'palace_display_name';

export function useDisplayName() {
  const [displayName, setDisplayNameState] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    storage.getItem(STORAGE_KEY).then((name) => {
      if (name) setDisplayNameState(name);
      setIsLoaded(true);
    });
  }, []);

  const setDisplayName = useCallback(async (name: string) => {
    const trimmed = name.trim().slice(0, 20);
    setDisplayNameState(trimmed);
    await storage.setItem(STORAGE_KEY, trimmed);
  }, []);

  return { displayName, setDisplayName, isLoaded };
}
