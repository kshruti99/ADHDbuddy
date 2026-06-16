import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Archive } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { ModePicker } from '@/components/ModePicker';
import type { Mode } from '@/lib/constants';

interface Props {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  backlogCount: number;
  onSubmitFocus: (text: string) => void;
  onViewBacklog: () => void;
}

export function CleanSlateEntry({ mode, onModeChange, backlogCount, onSubmitFocus, onViewBacklog }: Props) {
  const [value, setValue] = useState('');

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmitFocus(trimmed);
    setValue('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={24}>
      <View style={styles.inner}>
        <ModePicker mode={mode} onModeChange={onModeChange} />

        <View style={styles.quoteBox}>
          <Text style={styles.quote}>"We're just doing 5 minutes.</Text>
          <Text style={styles.quote}>That's enough."</Text>
        </View>

        <Text style={styles.prompt}>WHAT'S YOUR FOCUS TODAY?</Text>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder="Enter your main objective..."
          placeholderTextColor={colors.textMuted}
          multiline
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={handleSubmit}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.submitBtn, !value.trim() && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={!value.trim()}>
          <Text style={styles.submitBtnText}>Set My Focus</Text>
        </TouchableOpacity>

        {backlogCount > 0 && (
          <TouchableOpacity style={styles.backlogBtn} onPress={onViewBacklog} activeOpacity={0.8}>
            <Archive size={16} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.backlogBtnText}>
              View Yesterday's Backlog ({backlogCount})
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    justifyContent: 'center',
    gap: 20,
  },
  quoteBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  quote: {
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 28,
  },
  prompt: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary + '55',
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.35 },
  submitBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#000',
  },
  backlogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backlogBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
  },
});
