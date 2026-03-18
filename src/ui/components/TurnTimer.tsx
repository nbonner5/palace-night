import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

interface TurnTimerProps {
  remainingMs: number;
  totalMs: number;
}

export function TurnTimer({ remainingMs, totalMs }: TurnTimerProps) {
  const fraction = totalMs > 0 ? remainingMs / totalMs : 0;
  const isLow = fraction < 0.25;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${fraction * 100}%` },
            isLow && styles.fillLow,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.buttonPrimary,
    borderRadius: 2,
  },
  fillLow: {
    backgroundColor: colors.buttonDanger,
  },
});
