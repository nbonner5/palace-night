import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Card, Rank, Suit } from '../../types';
import { colors } from '../theme/colors';
import { CARD_BORDER_RADIUS, CARD_HEIGHT, CARD_HEIGHT_SMALL, CARD_WIDTH, CARD_WIDTH_SMALL } from '../theme/layout';

const RANK_DISPLAY: Record<number, string> = {
  [Rank.Joker]: 'JK',
  [Rank.Two]: '2',
  [Rank.Three]: '3',
  [Rank.Four]: '4',
  [Rank.Five]: '5',
  [Rank.Six]: '6',
  [Rank.Seven]: '7',
  [Rank.Eight]: '8',
  [Rank.Nine]: '9',
  [Rank.Ten]: '10',
  [Rank.Jack]: 'J',
  [Rank.Queen]: 'Q',
  [Rank.King]: 'K',
  [Rank.Ace]: 'A',
};

const SUIT_SYMBOL: Record<string, string> = {
  [Suit.Hearts]: '\u2665',
  [Suit.Diamonds]: '\u2666',
  [Suit.Clubs]: '\u2663',
  [Suit.Spades]: '\u2660',
};

interface CardViewProps {
  card: Card | null;
  faceDown: boolean;
  selected?: boolean;
  playable?: boolean;
  onPress?: () => void;
  onDoubleTap?: () => void;
  size?: 'small' | 'normal';
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CardView({ card, faceDown, selected = false, playable = true, onPress, onDoubleTap, size = 'normal', disabled = false }: CardViewProps) {
  const isSmall = size === 'small';
  const w = isSmall ? CARD_WIDTH_SMALL : CARD_WIDTH;
  const h = isSmall ? CARD_HEIGHT_SMALL : CARD_HEIGHT;
  const lastTapRef = useRef(0);

  const handlePress = () => {
    const now = Date.now();
    if (onDoubleTap && now - lastTapRef.current < 300) {
      lastTapRef.current = 0;
      onDoubleTap();
    } else {
      lastTapRef.current = now;
      onPress?.();
    }
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(selected ? -16 : 0, { damping: 15, stiffness: 200 }) }],
  }));

  if (faceDown || !card) {
    return (
      <View style={[styles.cardBack, { width: w, height: h }]}>
        <View style={styles.cardBackOuter}>
          <View style={styles.cardBackInner}>
            <View style={styles.cardBackDiamond} />
          </View>
        </View>
      </View>
    );
  }

  const isJoker = card.rank === Rank.Joker;
  const isRed = card.suit === Suit.Hearts || card.suit === Suit.Diamonds;
  const textColor = isJoker ? colors.jokerPurple : isRed ? colors.redSuit : colors.blackSuit;
  const rankStr = RANK_DISPLAY[card.rank] ?? '?';
  const suitStr = card.suit ? SUIT_SYMBOL[card.suit] ?? '' : '';

  return (
    <AnimatedPressable
      onPress={!disabled && playable ? handlePress : undefined}
      style={[
        styles.card,
        { width: w, height: h },
        selected && styles.cardSelected,
        !playable && styles.cardDimmed,
        animStyle,
      ]}
    >
      <View style={styles.topLeft}>
        <Text style={[styles.rankText, { color: textColor }, isSmall && styles.rankTextSmall]}>{rankStr}</Text>
        {!isJoker && <Text style={[styles.suitTextSmall, { color: textColor }]}>{suitStr}</Text>}
      </View>
      <Text style={[styles.centerSuit, { color: textColor }, isSmall && styles.centerSuitSmall]}>
        {isJoker ? 'JK' : suitStr}
      </Text>
      <View style={styles.bottomRight}>
        {!isJoker && <Text style={[styles.suitTextSmall, { color: textColor }]}>{suitStr}</Text>}
        <Text style={[styles.rankText, { color: textColor }, isSmall && styles.rankTextSmall]}>{rankStr}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardWhite,
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  cardSelected: {
    borderColor: colors.selectedBorder,
    borderWidth: 2,
    shadowColor: colors.selectedBorder,
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  cardDimmed: {
    opacity: colors.dimOpacity,
  },
  cardBack: {
    backgroundColor: colors.cardBack,
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 1.5,
    borderColor: colors.cardBackBorder,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 1,
  },
  cardBackOuter: {
    width: '85%',
    height: '85%',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.cardBackBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackInner: {
    width: '85%',
    height: '85%',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 75, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackDiamond: {
    width: 12,
    height: 12,
    backgroundColor: colors.cardBackBorder,
    transform: [{ rotate: '45deg' }],
  },
  topLeft: {
    position: 'absolute',
    top: 3,
    left: 4,
    alignItems: 'center',
  },
  bottomRight: {
    position: 'absolute',
    bottom: 3,
    right: 4,
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  rankTextSmall: {
    fontSize: 9,
    lineHeight: 11,
  },
  suitTextSmall: {
    fontSize: 9,
    lineHeight: 11,
  },
  centerSuit: {
    fontSize: 22,
    fontWeight: '700',
  },
  centerSuitSmall: {
    fontSize: 14,
  },
});
