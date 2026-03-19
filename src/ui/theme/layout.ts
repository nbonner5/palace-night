import { useWindowDimensions } from 'react-native';

export const CARD_WIDTH = 60;
export const CARD_HEIGHT = 84;
export const CARD_WIDTH_SMALL = 40;
export const CARD_HEIGHT_SMALL = 56;
export const CARD_WIDTH_TINY = 30;
export const CARD_HEIGHT_TINY = 42;
export const CARD_BORDER_RADIUS = 4;
export const CARD_OVERLAP = 20;
export const SELECTED_LIFT = -16;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isWide = width > 768;
  const isNarrow = width < 420;
  const cardWidth = isWide ? 70 : CARD_WIDTH;
  const cardHeight = isWide ? 98 : CARD_HEIGHT;
  const smallCardWidth = isWide ? 48 : CARD_WIDTH_SMALL;
  const smallCardHeight = isWide ? 67 : CARD_HEIGHT_SMALL;
  const cpuCardWidth = isNarrow ? CARD_WIDTH_TINY : CARD_WIDTH_SMALL;
  const cpuCardHeight = isNarrow ? CARD_HEIGHT_TINY : CARD_HEIGHT_SMALL;

  return {
    width,
    height,
    isWide,
    isNarrow,
    cardWidth,
    cardHeight,
    smallCardWidth,
    smallCardHeight,
    cpuCardWidth,
    cpuCardHeight,
  };
}
