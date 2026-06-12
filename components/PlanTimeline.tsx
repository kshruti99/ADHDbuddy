import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@/lib/colors';
import { formatRelative, formatTimeShort, type PlanBlock } from '@/lib/time';

type Props = {
  blocks: PlanBlock[];
  now: Date;
  onBlockPress?: (block: PlanBlock) => void;
};

export function PlanTimeline({ blocks, now, onBlockPress }: Props) {
  return (
    <View style={styles.container}>
      {blocks.map((block, i) => {
        const isPast = block.time.getTime() < now.getTime();
        const isNow = Math.abs(block.time.getTime() - now.getTime()) < 5 * 60000;
        return (
          <TouchableOpacity
            key={block.label}
            style={[
              styles.block,
              isPast && styles.blockPast,
              isNow && styles.blockNow,
              i === 0 && styles.blockFirst,
            ]}
            onPress={() => onBlockPress?.(block)}
            activeOpacity={0.8}
            disabled={!onBlockPress}>
            <View style={styles.blockLeft}>
              <View style={[styles.dot, isNow && styles.dotNow]} />
              {i < blocks.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.blockContent}>
              <View style={styles.blockHeader}>
                <Text style={[styles.label, isPast && styles.labelPast]}>{block.label}</Text>
                <Text style={[styles.time, isNow && styles.timeNow]}>
                  {formatTimeShort(block.time)}
                </Text>
              </View>
              <Text style={[styles.coaching, isPast && styles.coachingPast]}>{block.coaching}</Text>
              {!isPast && (
                <Text style={styles.relative}>{formatRelative(block.time, now)}</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 0 },
  block: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  blockFirst: {},
  blockPast: { opacity: 0.5 },
  blockNow: {
    backgroundColor: colors.accentMuted + '44',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginHorizontal: -12,
  },
  blockLeft: { alignItems: 'center', width: 16 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  dotNow: { backgroundColor: colors.accent, width: 12, height: 12, borderRadius: 6 },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
    minHeight: 40,
  },
  blockContent: { flex: 1, gap: 4 },
  blockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  labelPast: { color: colors.textMuted },
  time: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  timeNow: { color: colors.accent },
  coaching: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textSecondary, lineHeight: 20 },
  coachingPast: { color: colors.textMuted },
  relative: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.accent },
});
