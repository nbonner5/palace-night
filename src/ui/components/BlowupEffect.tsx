import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface BlowupEffectProps {
  visible: boolean;
  onComplete: () => void;
}

export function BlowupEffect({ visible, onComplete }: BlowupEffectProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(0, { duration: 400 }),
      );
      scale.value = withSequence(
        withTiming(1.3, { duration: 150 }),
        withTiming(1, { duration: 350 }),
      );
      const timer = setTimeout(() => onComplete(), 500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, animStyle]} pointerEvents="none" />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD700',
    zIndex: 200,
  },
});
