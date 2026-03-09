import { useCallback, useState } from 'react';
import { Card, Rank } from '../../types';

interface UseCardSelection {
  selectedIds: Set<string>;
  toggle: (cardId: string, cards: readonly Card[]) => void;
  clear: () => void;
  isValidSelection: boolean;
}

export function useCardSelection(): UseCardSelection {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null);

  const toggle = useCallback((cardId: string, cards: readonly Card[]) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        // Deselect
        next.delete(cardId);
        if (next.size === 0) {
          setSelectedRank(null);
        }
        return next;
      }

      // Selecting a card of different rank clears previous selection
      if (selectedRank !== null && card.rank !== selectedRank) {
        setSelectedRank(card.rank);
        return new Set([cardId]);
      }

      // Same rank or first selection
      next.add(cardId);
      setSelectedRank(card.rank);
      return next;
    });
  }, [selectedRank]);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedRank(null);
  }, []);

  return {
    selectedIds,
    toggle,
    clear,
    isValidSelection: selectedIds.size > 0,
  };
}
