import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/lib/colors';

interface Props {
  taskName: string;
  onDone: () => void;
}

export function PoofReward({ taskName, onDone }: Props) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.08, { damping: 12 }),
      withDelay(900, withTiming(0.85, { duration: 350 }))
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 250 }),
      withDelay(1000, withTiming(0, { duration: 400 }, (finished) => {
        if (finished) runOnJS(onDone)();
      }))
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.overlay]}
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(300)}>
      <Animated.View style={[styles.card, animStyle]}>
        <Text style={styles.emoji}>✨</Text>
        <Text style={styles.task}>{taskName}</Text>
        <Text style={styles.label}>COMPLETED</Text>
        <Text style={styles.sub}>POOF! Moving to history...</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.success + '66',
    padding: 36,
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 32,
  },
  emoji: { fontSize: 48 },
  task: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
  },
  label: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: colors.success,
    letterSpacing: 2,
  },
  sub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
