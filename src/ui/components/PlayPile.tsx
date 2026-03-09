import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../types';
import { colors } from '../theme/colors';
import { CARD_WIDTH, CARD_HEIGHT, CARD_BORDER_RADIUS } from '../theme/layout';
import { CardView } from './CardView';

interface PlayPileProps {
  pile: readonly Card[];
}

export function PlayPile({ pile }: PlayPileProps) {
  const topCard = pile.length > 0 ? pile[pile.length - 1] : undefined;

  return (
    <View style={styles.container}>
      {pile.length > 1 && (
        <View style={styles.shadow} />
      )}
      {pile.length > 2 && (
        <View style={[styles.shadow, { top: -2, left: -2 }]} />
      )}
      {topCard ? (
        <CardView card={topCard} faceDown={false} disabled />
      ) : (
        <View style={styles.emptyPile}>
          <Text style={styles.emptyText}>Pile</Text>
        </View>
      )}
      {pile.length > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pile.length}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#2A5A3A',
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: '#3A6A4A',
  },
  emptyPile: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
  },
  badge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
});
