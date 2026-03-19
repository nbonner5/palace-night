/**
 * Returns the maximum number of players supportable by the given deck configuration.
 * Each player needs 9 cards (6 hand + 3 face-down).
 */
export function getMaxPlayerCount(deckCount: number, includeJokers: boolean): number {
  const totalCards = deckCount * 52 + (includeJokers ? deckCount * 2 : 0);
  return Math.floor(totalCards / 9);
}
