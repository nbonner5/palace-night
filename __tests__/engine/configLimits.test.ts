import { getMaxPlayerCount } from '../../src/engine/configLimits';

describe('getMaxPlayerCount', () => {
  it('1 deck no jokers = 5 max (52 / 9 = 5.77)', () => {
    expect(getMaxPlayerCount(1, false)).toBe(5);
  });

  it('1 deck with jokers = 6 max (54 / 9 = 6.0)', () => {
    expect(getMaxPlayerCount(1, true)).toBe(6);
  });

  it('2 decks no jokers = 11 max (104 / 9 = 11.55)', () => {
    expect(getMaxPlayerCount(2, false)).toBe(11);
  });

  it('2 decks with jokers = 12 max (108 / 9 = 12.0)', () => {
    expect(getMaxPlayerCount(2, true)).toBe(12);
  });

  it('3 decks no jokers = 17 max (156 / 9 = 17.33)', () => {
    expect(getMaxPlayerCount(3, false)).toBe(17);
  });

  it('3 decks with jokers = 18 max (162 / 9 = 18.0)', () => {
    expect(getMaxPlayerCount(3, true)).toBe(18);
  });

  it('2+ decks always supports at least 7 players', () => {
    expect(getMaxPlayerCount(2, false)).toBeGreaterThanOrEqual(7);
    expect(getMaxPlayerCount(2, true)).toBeGreaterThanOrEqual(7);
    expect(getMaxPlayerCount(3, false)).toBeGreaterThanOrEqual(7);
    expect(getMaxPlayerCount(3, true)).toBeGreaterThanOrEqual(7);
  });

  it('1 deck no jokers cannot support 6 players (6 * 9 = 54 > 52)', () => {
    expect(getMaxPlayerCount(1, false)).toBeLessThan(6);
  });

  it('1 deck with jokers cannot support 7 players (7 * 9 = 63 > 54)', () => {
    expect(getMaxPlayerCount(1, true)).toBeLessThan(7);
  });
});
