import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { MODE_OPTIONS, type Mode } from '@/lib/constants';

type Props = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
};

export function ModePicker({ mode, onModeChange }: Props) {
  const [open, setOpen] = useState(false);
  const label = MODE_OPTIONS.find((m) => m.value === mode)?.label || mode;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>MODE</Text>
      <View style={styles.wrap}>
        <TouchableOpacity style={styles.btn} onPress={() => setOpen((o) => !o)} activeOpacity={0.8}>
          <Text style={styles.btnText}>{label}</Text>
          <ChevronDown
            size={16}
            color={colors.textMuted}
            strokeWidth={2}
            style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
        {open && (
          <View style={styles.list}>
            {MODE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.item, mode === opt.value && styles.itemActive]}
                onPress={() => {
                  onModeChange(opt.value);
                  setOpen(false);
                }}
                activeOpacity={0.7}>
                <Text style={[styles.itemText, mode === opt.value && styles.itemTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  wrap: { position: 'relative', zIndex: 10 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  btnText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  list: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    minWidth: 170,
    zIndex: 20,
  },
  item: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  itemActive: { backgroundColor: colors.primaryMuted },
  itemText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  itemTextActive: { color: colors.primaryLight },
});
