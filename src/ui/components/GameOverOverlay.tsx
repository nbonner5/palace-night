import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface GameOverOverlayProps {
  winnerId: number;
  onNewGame: () => void;
}

const PLAYER_NAMES = ['You', 'CPU 1', 'CPU 2', 'CPU 3'];

export function GameOverOverlay({ winnerId, onNewGame }: GameOverOverlayProps) {
  const isHumanWin = winnerId === 0;

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <Text style={[styles.title, isHumanWin ? styles.winTitle : styles.loseTitle]}>
          {isHumanWin ? 'You Win!' : `${PLAYER_NAMES[winnerId]} Wins`}
        </Text>
        <Pressable onPress={onNewGame} style={styles.button}>
          <Text style={styles.buttonText}>New Game</Text>
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
    gap: 24,
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  winTitle: {
    color: colors.turnGold,
  },
  loseTitle: {
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
});
