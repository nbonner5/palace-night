import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '../../types';
import { CardView } from './CardView';

interface HumanFaceUpProps {
  cards: readonly Card[];
  selectedIds: Set<string>;
  playableIds: Set<string>;
  onCardPress: (cardId: string) => void;
  disabled: boolean;
}

export function HumanFaceUp({ cards, selectedIds, playableIds, onCardPress, disabled }: HumanFaceUpProps) {
  if (cards.length === 0) return null;

  return (
    <View style={styles.container}>
      {cards.map((card) => (
        <CardView
          key={card.id}
          card={card}
          faceDown={false}
          selected={selectedIds.has(card.id)}
          playable={playableIds.has(card.id)}
          onPress={() => onCardPress(card.id)}
          disabled={disabled}
        />
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
});
