import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'palace_display_name';

// Web fallback for environments without AsyncStorage
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
};

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
