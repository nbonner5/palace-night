import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface PlayerLabelProps {
  name: string;
  isCurrentTurn: boolean;
}

export function PlayerLabel({ name, isCurrentTurn }: PlayerLabelProps) {
  return (
    <View style={styles.container}>
      {isCurrentTurn && <View style={styles.dot} />}
      <Text style={[styles.text, isCurrentTurn && styles.textActive]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.turnGold,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  textActive: {
    color: colors.turnGold,
  },
});
