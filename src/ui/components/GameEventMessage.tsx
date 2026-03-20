import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

interface GameEventMessageProps {
  message: string | null;
  onDismiss: () => void;
}

export function GameEventMessage({ message, onDismiss }: GameEventMessageProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  useEffect(() => {
    if (message) {
      opacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withDelay(1500, withTiming(0, { duration: 300 }, () => {
          runOnJS(onDismiss)();
        })),
      );
      translateY.value = withSequence(
        withTiming(0, { duration: 150 }),
        withDelay(1500, withTiming(-10, { duration: 300 })),
      );
    }
  }, [message]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!message) return null;

  return (
    <Animated.View style={[styles.container, animStyle]} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 150,
  },
  text: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '800',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
