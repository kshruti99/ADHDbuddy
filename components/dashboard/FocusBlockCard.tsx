import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import { Play } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import type { FocusItem } from '@/lib/supabase';

interface Props {
  item: FocusItem;
  onLaunch: (item: FocusItem) => void;
}

export function FocusBlockCard({ item, onLaunch }: Props) {
  return (
    <Animated.View
      layout={LinearTransition.springify().damping(18)}
      exiting={FadeOut.duration(300)}
      style={styles.wrapper}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onLaunch(item)}
        activeOpacity={0.82}>
        <View style={styles.playIcon}>
          <Play size={18} color={colors.accent} strokeWidth={2.5} fill={colors.accent} />
        </View>
        <Text style={styles.label} numberOfLines={3}>
          {item.content}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 22,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
    lineHeight: 24,
  },
});
