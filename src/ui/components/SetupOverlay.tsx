import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../types';
import { colors } from '../theme/colors';
import { CardView } from './CardView';

interface SetupOverlayProps {
  hand: readonly Card[];
  onConfirm: (cardIds: string[]) => void;
}

export function SetupOverlay({ hand, onConfirm }: SetupOverlayProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (cardId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else if (next.size < 3) {
        next.add(cardId);
      }
      return next;
    });
  };

  const canConfirm = selected.size === 3;

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose 3 Face-Up Cards</Text>
        <Text style={styles.subtitle}>{selected.size}/3 selected</Text>

        <View style={styles.grid}>
          {hand.map((card) => (
            <View key={card.id} style={styles.cardSlot}>
              <CardView
                card={card}
                faceDown={false}
                selected={selected.has(card.id)}
                onPress={() => toggle(card.id)}
              />
            </View>
          ))}
        </View>

        <Pressable
          onPress={canConfirm ? () => onConfirm([...selected]) : undefined}
          style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
        >
          <Text style={[styles.confirmText, !canConfirm && styles.confirmTextDisabled]}>
            Confirm
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayBg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 280,
  },
  cardSlot: {
    // individual card sizing handled by CardView
  },
  confirmButton: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.buttonDisabled,
    opacity: 0.6,
  },
  confirmText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  confirmTextDisabled: {
    color: colors.textSecondary,
  },
});
