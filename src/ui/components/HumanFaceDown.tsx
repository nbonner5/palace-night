import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, PlayerPhase } from '../../types';
import { CARD_WIDTH, CARD_HEIGHT, CARD_BORDER_RADIUS } from '../theme/layout';
import { colors } from '../theme/colors';

interface HumanFaceDownProps {
  cards: readonly Card[];
  playerPhase: PlayerPhase;
  onSlotPress: (slotIndex: number) => void;
  disabled: boolean;
}

export function HumanFaceDown({ cards, playerPhase, onSlotPress, disabled }: HumanFaceDownProps) {
  if (cards.length === 0) return null;

  const isFaceDownPhase = playerPhase === PlayerPhase.FaceDown;

  return (
    <View style={styles.container}>
      {cards.map((_, index) => (
        <Pressable
          key={index}
          onPress={isFaceDownPhase && !disabled ? () => onSlotPress(index) : undefined}
          style={[
            styles.slot,
            isFaceDownPhase && !disabled && styles.slotTappable,
          ]}
        >
          <View style={styles.innerBorder} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  slot: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.cardBack,
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: colors.cardBackBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotTappable: {
    borderColor: colors.turnGold,
    borderWidth: 2,
  },
  innerBorder: {
    width: '70%',
    height: '70%',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.cardBackBorder,
  },
});
