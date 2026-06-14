import React from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors } from '@/lib/colors';
import { QUOTES } from '@/lib/constants';

const screenHeight = Dimensions.get('window').height;
export const QUOTE_ZONE_HEIGHT = screenHeight - 100;
export const FADE_START = QUOTE_ZONE_HEIGHT - 120;
export const FADE_END = QUOTE_ZONE_HEIGHT - 20;

type Props = {
  quoteIdx: number;
  gradientStyle: object;
};

export function QuoteHero({ quoteIdx, gradientStyle }: Props) {
  return (
    <>
      <View style={[styles.hero, { minHeight: QUOTE_ZONE_HEIGHT }]}>
        <View style={styles.content}>
          <Text style={styles.sparkle}>✦</Text>
          <Text style={styles.text}>{QUOTES[quoteIdx]}</Text>
          <Text style={styles.sparkle}>✦</Text>
        </View>
      </View>
      <Animated.View style={[styles.gradientMask, gradientStyle]} pointerEvents="none" />
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center', gap: 14 },
  sparkle: {
    fontSize: 14,
    color: colors.primary,
    opacity: 0.4,
    letterSpacing: 6,
  },
  text: {
    fontSize: 26,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: 0.3,
  },
  gradientMask: {
    position: 'absolute',
    top: screenHeight - 200,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 5,
    ...(Platform.OS === 'web'
      ? { backgroundImage: `linear-gradient(to bottom, ${colors.bg}, transparent)` }
      : { backgroundColor: colors.bg, opacity: 0.7 }),
  },
});
