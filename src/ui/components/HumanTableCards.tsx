import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, PlayerPhase } from '../../types';
import { CARD_WIDTH, CARD_HEIGHT, CARD_BORDER_RADIUS } from '../theme/layout';
import { colors } from '../theme/colors';
import { CardView } from './CardView';

interface HumanTableCardsProps {
  faceDown: readonly Card[];
  faceUp: readonly Card[];
  playerPhase: PlayerPhase;
  isHumanTurn: boolean;
  onSlotPress: (slotIndex: number) => void;
}

const FACE_DOWN_OFFSET = 10;

export function HumanTableCards({ faceDown, faceUp, playerPhase, isHumanTurn, onSlotPress }: HumanTableCardsProps) {
  if (faceDown.length === 0) return null;

  const isFaceDownPhase = playerPhase === PlayerPhase.FaceDown;
  const canTap = isFaceDownPhase && isHumanTurn;

  return (
    <View style={styles.container}>
      {faceDown.map((_, index) => {
        const faceUpCard = faceUp[index] ?? null;

        return (
          <View key={index} style={styles.stack}>
            {/* Face-down card on bottom, offset down (hidden during face-down phase) */}
            {!isFaceDownPhase && (
              <View style={styles.faceDownLayer}>
                <View style={[styles.slot]}>
                  <View style={styles.cardBackOuter}>
                    <View style={styles.cardBackInner}>
                      <View style={styles.cardBackDiamond} />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Face-up card on top (or tappable slot during face-down phase) */}
            <View style={styles.faceUpLayer}>
              {faceUpCard ? (
                <CardView
                  card={faceUpCard}
                  faceDown={false}
                  disabled={true}
                  playable={false}
                />
              ) : canTap ? (
                <Pressable
                  onPress={() => onSlotPress(index)}
                  style={[styles.slot, styles.slotTappable]}
                >
                  <View style={styles.cardBackOuter}>
                    <View style={styles.cardBackInner}>
                      <View style={styles.cardBackDiamond} />
                    </View>
                  </View>
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  stack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + FACE_DOWN_OFFSET + 4,
  },
  faceDownLayer: {
    position: 'absolute',
    top: FACE_DOWN_OFFSET,
    left: 0,
  },
  faceUpLayer: {
    position: 'absolute',
    top: -4,
    left: 0,
  },
  slot: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.cardBack,
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 1.5,
    borderColor: colors.cardBackBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotTappable: {
    borderColor: colors.turnGold,
    borderWidth: 2,
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
});
