import { useCallback, useEffect, useState } from 'react';
import { GameConfig, DEFAULT_CONFIG } from '../../types';
import { storage } from './storage';

const STORAGE_KEY = 'palace_game_config';

export function usePersistedConfig() {
  const [config, setConfigState] = useState<GameConfig>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    storage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<GameConfig>;
          setConfigState({
            cpuCount: typeof parsed.cpuCount === 'number' ? parsed.cpuCount : DEFAULT_CONFIG.cpuCount,
            deckCount: typeof parsed.deckCount === 'number' ? parsed.deckCount : DEFAULT_CONFIG.deckCount,
            includeJokers: typeof parsed.includeJokers === 'boolean' ? parsed.includeJokers : DEFAULT_CONFIG.includeJokers,
          });
        } catch {
          // corrupted data, use defaults
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const setConfig = useCallback(async (next: GameConfig) => {
    setConfigState(next);
    await storage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  return { config, setConfig, isLoaded };
}
