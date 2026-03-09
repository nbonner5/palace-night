import { Card, Rank, Suit } from '../../src/types';

let idCounter = 0;

export function resetIdCounter(): void {
  idCounter = 0;
}

export function card(rank: Rank, suit?: Suit | null, id?: string): Card {
  const resolvedSuit = rank === Rank.Joker ? null : (suit ?? Suit.Hearts);
  const resolvedId = id ?? `${resolvedSuit ?? 'JK'}${rank}-${idCounter++}`;
  return { id: resolvedId, rank, suit: resolvedSuit };
}

export function joker(id?: string): Card {
  return card(Rank.Joker, null, id);
}

export function ten(suit?: Suit, id?: string): Card {
  return card(Rank.Ten, suit, id);
}

export function two(suit?: Suit, id?: string): Card {
  return card(Rank.Two, suit, id);
}

export function cards(...specs: Array<[Rank, Suit?]>): Card[] {
  return specs.map(([r, s]) => card(r, s));
}
