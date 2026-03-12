import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'
import { CARD_WIDTH, CARD_HEIGHT, CARD_BORDER_RADIUS } from '../theme/layout'

interface DrawPileProps {
  count: number
}

export function DrawPile({ count }: DrawPileProps) {
  if (count === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Draw</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.cardBack}>
        <View style={styles.cardBackOuter}>
          <View style={styles.cardBackInner}>
            <View style={styles.cardBackDiamond} />
          </View>
        </View>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
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
  empty: {
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
})
