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
        <View style={styles.innerBorder} />
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
    borderWidth: 1,
    borderColor: colors.cardBackBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerBorder: {
    width: '70%',
    height: '70%',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.cardBackBorder,
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
