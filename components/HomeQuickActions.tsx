import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Brain, Calendar, Lightbulb, ListChecks, Sparkles, Timer } from 'lucide-react-native';
import { colors } from '@/lib/colors';

type Props = {
  onHelpMePick: () => void;
  onQuickCapture?: (text: string) => void;
  captureValue?: string;
  onCaptureChange?: (text: string) => void;
};

export function HomeQuickActions({
  onHelpMePick,
  onQuickCapture,
  captureValue = '',
  onCaptureChange,
}: Props) {
  const router = useRouter();

  const actions = [
    {
      label: 'My 3 today',
      icon: ListChecks,
      color: colors.primary,
      onPress: () => router.push({ pathname: '/tasks', params: { segment: 'focus' } }),
    },
    {
      label: 'Brain dump',
      icon: Brain,
      color: colors.accent,
      onPress: () => router.push({ pathname: '/tasks', params: { segment: 'backlog' } }),
    },
    {
      label: 'Help me pick',
      icon: Sparkles,
      color: colors.accent,
      onPress: onHelpMePick,
    },
    {
      label: 'Plan something',
      icon: Calendar,
      color: colors.success,
      onPress: () => router.push({ pathname: '/unstuck', params: { tab: 'plan' } }),
    },
    {
      label: "I'm stuck",
      icon: Lightbulb,
      color: colors.warning,
      onPress: () => router.push({ pathname: '/unstuck', params: { tab: 'unstuck' } }),
    },
    {
      label: 'Start focus',
      icon: Timer,
      color: colors.primaryLight,
      onPress: () => router.push('/boredom-buster'),
    },
  ];

  return (
    <View style={styles.container}>
      {onQuickCapture && onCaptureChange && (
        <TextInput
          style={styles.capture}
          value={captureValue}
          onChangeText={onCaptureChange}
          placeholder="What's on your mind? (quick capture)"
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={() => {
            if (captureValue.trim()) {
              onQuickCapture(captureValue);
              onCaptureChange('');
            }
          }}
          returnKeyType="done"
        />
      )}
      <View style={styles.grid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.card}
            onPress={action.onPress}
            activeOpacity={0.8}>
            <action.icon size={22} color={action.color} strokeWidth={2} />
            <Text style={styles.cardLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 12, paddingBottom: 24 },
  capture: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 10,
    minHeight: 88,
  },
  cardLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
