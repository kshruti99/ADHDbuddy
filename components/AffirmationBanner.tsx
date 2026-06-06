import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/lib/colors';

const AFFIRMATIONS = [
  'Progress over perfection.',
  "It's okay that your brain works differently.",
  "We're just doing 5 minutes.",
  'You showed up. That counts.',
  'One tiny step is still a step.',
  'Rest is not the enemy of productivity.',
  "You're not behind. You're right here.",
  'Done is better than perfect.',
  'Your effort matters, even when it feels small.',
  "It's okay to start over.",
  'Being gentle with yourself is a superpower.',
  'You are not your to-do list.',
];

export default function AffirmationBanner() {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % AFFIRMATIONS.length);
      }, 600);
    }, 6000);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <Text style={styles.sparkle}>✦</Text>
      <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
        {AFFIRMATIONS[index]}
      </Animated.Text>
      <Text style={styles.sparkle}>✦</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    gap: 10,
  },
  sparkle: {
    fontSize: 10,
    color: colors.primary,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
});
