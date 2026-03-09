import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface ActionBarProps {
  canPlay: boolean;
  canPickUp: boolean;
  onPlay: () => void;
  onPickUp: () => void;
  selectedCount: number;
}

export function ActionBar({ canPlay, canPickUp, onPlay, onPickUp, selectedCount }: ActionBarProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={canPlay ? onPlay : undefined}
        style={[styles.button, styles.playButton, !canPlay && styles.buttonDisabled]}
      >
        <Text style={[styles.buttonText, !canPlay && styles.buttonTextDisabled]}>
          {selectedCount > 0 ? `Play (${selectedCount})` : 'Play'}
        </Text>
      </Pressable>
      <Pressable
        onPress={canPickUp ? onPickUp : undefined}
        style={[styles.button, styles.pickUpButton, !canPickUp && styles.buttonDisabled]}
      >
        <Text style={[styles.buttonText, !canPickUp && styles.buttonTextDisabled]}>
          Pick Up
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: colors.buttonPrimary,
  },
  pickUpButton: {
    backgroundColor: colors.buttonDanger,
  },
  buttonDisabled: {
    backgroundColor: colors.buttonDisabled,
    opacity: 0.6,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonTextDisabled: {
    color: colors.textSecondary,
  },
});
