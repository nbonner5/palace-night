import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface BurnCounterProps {
  count: number;
}

export function BurnCounter({ count }: BurnCounterProps) {
  if (count === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔥</Text>
      <Text style={styles.text}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  icon: {
    fontSize: 12,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
