import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { colors } from '@/lib/colors';

const DELETE_THRESHOLD = -80;
const SPRING_CONFIG = { damping: 20, stiffness: 300, overshootClamping: true };

type SwipeableRowProps = {
  children: React.ReactNode;
  onDelete: () => void;
  onSwipeWillOpen?: () => void;
};

export function SwipeableRow({ children, onDelete, onSwipeWillOpen }: SwipeableRowProps) {
  const translateX = useSharedValue(0);
  const isDeleting = useSharedValue(false);
  const itemHeight = useSharedValue(-1);
  const opacity = useSharedValue(1);
  const hasCalledWillOpen = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 30])
    .failOffsetY([-5, 5])
    .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      if (isDeleting.value) return;
      const val = Math.min(0, Math.max(event.translationX, -160));
      translateX.value = val;

      if (val < -20 && !hasCalledWillOpen.value) {
        hasCalledWillOpen.value = true;
        if (onSwipeWillOpen) runOnJS(onSwipeWillOpen)();
      }
    })
    .onEnd(() => {
      if (isDeleting.value) return;
      if (translateX.value < DELETE_THRESHOLD) {
        isDeleting.value = true;
        translateX.value = withTiming(-160, { duration: 150 });
        opacity.value = withTiming(0, { duration: 200 });
        itemHeight.value = withTiming(0, { duration: 200 }, (finished) => {
          if (finished) runOnJS(onDelete)();
        });
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
        hasCalledWillOpen.value = false;
      }
    })
    .onFinalize(() => {
      hasCalledWillOpen.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    height: itemHeight.value === -1 ? undefined : itemHeight.value,
    opacity: opacity.value,
  }));

  const deleteBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, -40, DELETE_THRESHOLD],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      { scale: interpolate(translateX.value, [-20, DELETE_THRESHOLD], [0.8, 1], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.deleteBg} pointerEvents="none">
        <Animated.View style={[styles.deleteInner, deleteBgStyle]}>
          <Trash2 size={18} color={colors.white} strokeWidth={2} />
        </Animated.View>
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle} onLayout={(e) => {
          if (itemHeight.value === -1) itemHeight.value = e.nativeEvent.layout.height;
        }}>
          {children}
        </Animated.View>
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
  deleteBg: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexDirection: 'row',
    paddingRight: 20,
  },
  deleteInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E53E3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
