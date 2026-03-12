import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GamePhase } from '../../types';
import { colors } from '../theme/colors';

interface TurnIndicatorProps {
  currentPlayerIndex: number;
  gamePhase: GamePhase;
  mustPlayAgain: boolean;
  isProcessing: boolean;
}

function getPlayerName(index: number): string {
  return index === 0 ? 'You' : `CPU ${index}`;
}

export function TurnIndicator({ currentPlayerIndex, gamePhase, mustPlayAgain, isProcessing }: TurnIndicatorProps) {
  if (gamePhase === GamePhase.Finished) {
    return null;
  }

  let message: string;
  if (gamePhase === GamePhase.Setup) {
    message = currentPlayerIndex === 0 ? 'Choose your face-up cards' : 'Setting up...';
  } else if (currentPlayerIndex === 0) {
    message = mustPlayAgain ? 'Play again!' : 'Your turn';
  } else {
    message = `${getPlayerName(currentPlayerIndex)} is thinking...`;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.text, currentPlayerIndex === 0 && styles.textHighlight]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  text: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  textHighlight: {
    color: colors.turnGold,
  },
});
