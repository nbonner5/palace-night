import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface PauseOverlayProps {
  onResume: () => void;
  onNewGame: () => void;
  onExitToHome: () => void;
}

export function PauseOverlay({ onResume, onNewGame, onExitToHome }: PauseOverlayProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <Text style={styles.title}>Paused</Text>
        <Pressable onPress={onResume} style={styles.button}>
          <Text style={styles.buttonText}>Resume</Text>
        </Pressable>
        <Pressable onPress={onNewGame} style={styles.button}>
          <Text style={styles.buttonText}>New Game</Text>
        </Pressable>
        <Pressable onPress={onExitToHome} style={styles.dangerButton}>
          <Text style={styles.buttonText}>Exit to Home</Text>
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
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  button: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: colors.buttonDanger,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
});
