import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import type { AnchorItem } from '@/lib/supabase';
import {
  formatRelative,
  formatTimeShort,
  getAnchorDate,
  getFeetOnFloorDate,
  sortAnchorsByTime,
} from '@/lib/time';
import { useNow } from '@/hooks/useNow';

type Props = {
  anchors: AnchorItem[];
  onAdd: () => void;
  onEdit: (anchor: AnchorItem) => void;
};

export function DayCalendar({ anchors, onAdd, onEdit }: Props) {
  const now = useNow();
  const { past, current, upcoming } = sortAnchorsByTime(anchors, now);
  const [showPast, setShowPast] = useState(false);

  const nextUp = upcoming[0] ?? null;
  const restUpcoming = upcoming.slice(1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Today</Text>
        <View style={styles.nowRow}>
          <View style={styles.nowDot} />
          <Text style={styles.nowLabel}>NOW</Text>
          <Text style={styles.nowTime}>{formatTimeShort(now)}</Text>
        </View>
      </View>

      {past.length > 0 && (
        <TouchableOpacity onPress={() => setShowPast((s) => !s)} style={styles.pastToggle}>
          <Text style={styles.pastToggleText}>
            {showPast ? 'Hide' : 'Show'} earlier today ({past.length})
          </Text>
        </TouchableOpacity>
      )}

      {showPast &&
        past.map((anchor) => (
          <TouchableOpacity
            key={anchor.id}
            style={[styles.eventRow, styles.eventPast]}
            onPress={() => onEdit(anchor)}
            activeOpacity={0.7}>
            <Text style={styles.checkMark}>✓</Text>
            <Text style={styles.eventTitlePast}>{anchor.title}</Text>
            <Text style={styles.eventTimePast}>
              {formatTimeShort(getAnchorDate(anchor, now)!)}
            </Text>
          </TouchableOpacity>
        ))}

      {nextUp && (
        <TouchableOpacity
          style={[styles.featured, current?.id === nextUp.id && styles.featuredActive]}
          onPress={() => onEdit(nextUp)}
          activeOpacity={0.8}>
          <View style={styles.featuredTop}>
            <Text style={styles.featuredLabel}>
              {current?.id === nextUp.id ? 'HAPPENING NOW' : 'UP NEXT'}
            </Text>
            <Text style={styles.featuredRelative}>
              {formatRelative(getAnchorDate(nextUp, now)!, now)}
            </Text>
          </View>
          <Text style={styles.featuredTitle}>{nextUp.title}</Text>
          <Text style={styles.featuredTime}>
            {formatTimeShort(getAnchorDate(nextUp, now)!)}
          </Text>
          {getFeetOnFloorDate(nextUp, now) && (
            <View style={styles.feetRow}>
              <Clock size={12} color={colors.success} strokeWidth={2} />
              <Text style={styles.feetText}>
                Feet on floor: {formatTimeShort(getFeetOnFloorDate(nextUp, now)!)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {restUpcoming.map((anchor) => (
        <TouchableOpacity
          key={anchor.id}
          style={styles.eventRow}
          onPress={() => onEdit(anchor)}
          activeOpacity={0.7}>
          <View style={styles.futureDot} />
          <Text style={styles.eventTitle}>{anchor.title}</Text>
          <Text style={styles.eventTime}>
            {formatTimeShort(getAnchorDate(anchor, now)!)}
          </Text>
          <Text style={styles.eventRelative}>
            {formatRelative(getAnchorDate(anchor, now)!, now)}
          </Text>
        </TouchableOpacity>
      ))}

      {anchors.length === 0 && (
        <Text style={styles.empty}>No events today. Add one when you have a hard deadline.</Text>
      )}

      <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.8}>
        <Text style={styles.addBtnText}>+ Add event</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  nowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  nowLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.accent, letterSpacing: 0.8 },
  nowTime: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  pastToggle: { paddingVertical: 4 },
  pastToggleText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  eventPast: { opacity: 0.45 },
  checkMark: { fontSize: 12, color: colors.success, width: 16 },
  eventTitlePast: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  eventTimePast: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textMuted },
  featured: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary + '44',
    padding: 16,
    gap: 4,
  },
  featuredActive: {
    borderColor: colors.accent + '88',
    backgroundColor: colors.accentMuted + '33',
  },
  featuredTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featuredLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: colors.primaryLight,
    letterSpacing: 0.8,
  },
  featuredRelative: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.accent },
  featuredTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  featuredTime: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  feetRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  feetText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.success },
  futureDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  eventTitle: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  eventTime: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  eventRelative: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textMuted, minWidth: 56, textAlign: 'right' },
  empty: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
    lineHeight: 20,
  },
  addBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.primaryLight },
});
