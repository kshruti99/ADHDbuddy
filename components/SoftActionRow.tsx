import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors } from '@/lib/colors';

const ACTION_WIDTH = 140;
const SPRING_CONFIG = { damping: 20, stiffness: 300, overshootClamping: true };

type SoftActionRowProps = {
  children: React.ReactNode;
  onDone?: () => void;
  onLater?: () => void;
};

export function SoftActionRow({ children, onDone, onLater }: SoftActionRowProps) {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 30])
    .failOffsetY([-5, 5])
    .onUpdate((event) => {
      translateX.value = Math.min(0, Math.max(event.translationX, -ACTION_WIDTH));
    })
    .onEnd(() => {
      if (translateX.value < -ACTION_WIDTH / 2) {
        translateX.value = withSpring(-ACTION_WIDTH, SPRING_CONFIG);
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -40], [0, 1], Extrapolation.CLAMP),
  }));

  const handleDone = () => {
    if (onDone) onDone();
    translateX.value = withSpring(0, SPRING_CONFIG);
  };

  const handleLater = () => {
    if (onLater) onLater();
    translateX.value = withSpring(0, SPRING_CONFIG);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.actions, actionsStyle]}>
        {onLater && (
          <TouchableOpacity style={styles.laterBtn} onPress={handleLater} activeOpacity={0.8}>
            <Text style={styles.laterText}>Later</Text>
          </TouchableOpacity>
        )}
        {onDone && (
          <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.8}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  actions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  laterBtn: {
    width: 70,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  laterText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textSecondary,
  },
  doneBtn: {
    width: 70,
    backgroundColor: colors.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.success,
  },
});
