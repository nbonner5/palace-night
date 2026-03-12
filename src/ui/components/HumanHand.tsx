import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Card } from '../../types';
import { CARD_WIDTH } from '../theme/layout';
import { CardView } from './CardView';

interface HumanHandProps {
  cards: readonly Card[];
  selectedIds: Set<string>;
  playableIds: Set<string>;
  onCardPress: (cardId: string) => void;
  onDoubleTapCard?: (cardId: string) => void;
  disabled: boolean;
}

export function HumanHand({ cards, selectedIds, playableIds, onCardPress, onDoubleTapCard, disabled }: HumanHandProps) {
  const { width } = useWindowDimensions();

  // Compute overlap so cards fit on screen
  const availableWidth = width - 32; // padding
  const overlap = cards.length > 1
    ? Math.min(CARD_WIDTH, availableWidth / cards.length)
    : CARD_WIDTH;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {cards.map((card, index) => (
        <View
          key={card.id}
          style={[
            styles.cardSlot,
            index > 0 && { marginLeft: overlap - CARD_WIDTH },
            { zIndex: index },
          ]}
        >
          <CardView
            card={card}
            faceDown={false}
            selected={selectedIds.has(card.id)}
            playable={playableIds.has(card.id)}
            onPress={() => onCardPress(card.id)}
            onDoubleTap={onDoubleTapCard ? () => onDoubleTapCard(card.id) : undefined}
            disabled={disabled}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    alignItems: 'flex-end',
  },
  cardSlot: {
    // Each card needs to be above the previous for tap handling
  },
});
