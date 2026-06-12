import React, { useCallback, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '@/lib/colors';
import { getDailyQuoteIndex, type EnergyTag, type WizardStep } from '@/lib/constants';
import { useMode } from '@/context/ModeContext';
import { useBacklog } from '@/hooks/useBacklog';
import { useFocus } from '@/hooks/useFocus';
import { QuoteHero, FADE_END, FADE_START } from '@/components/QuoteHero';
import { ModePicker } from '@/components/ModePicker';
import { HomeQuickActions } from '@/components/HomeQuickActions';
import { HelpMePickModal } from '@/components/modals/HelpMePickModal';
import type { BacklogItem } from '@/lib/supabase';

export default function HomeScreen() {
  const { mode, setMode } = useMode();
  const focus = useFocus(mode);
  const backlog = useBacklog(mode);
  const quoteIdx = useRef(getDailyQuoteIndex()).current;

  const [capture, setCapture] = useState('');
  const [wizardStep, setWizardStep] = useState<WizardStep>('closed');
  const [wizardChoices, setWizardChoices] = useState<BacklogItem[]>([]);

  const contentOpacity = useSharedValue(0);
  const gradientOpacity = useSharedValue(0);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const fade = Math.min(1, Math.max(0, (y - FADE_START) / (FADE_END - FADE_START)));
    contentOpacity.value = withTiming(fade, { duration: 80 });
    gradientOpacity.value = Math.min(1, Math.max(0, y / 400));
  }, []);

  const contentAnimStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));
  const gradientAnimStyle = useAnimatedStyle(() => ({ opacity: gradientOpacity.value }));

  function startWizard() {
    setWizardStep('energy');
    setWizardChoices([]);
  }

  function pickEnergy(energy: EnergyTag) {
    const matches = backlog.incomplete.filter((b) => b.energy_tag === energy);
    const shuffled = [...matches].sort(() => Math.random() - 0.5);
    setWizardChoices(shuffled.slice(0, 2));
    setWizardStep('pick');
  }

  async function pickChoice(item: BacklogItem) {
    await backlog.promoteToFocus(item, focus.active.length, (content) => focus.setOverflow(content));
    await focus.reload();
    setWizardStep('closed');
  }

  if (backlog.loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading your space...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}>
          <QuoteHero quoteIdx={quoteIdx} gradientStyle={gradientAnimStyle} />

          <Animated.View style={contentAnimStyle}>
            <ModePicker mode={mode} onModeChange={setMode} />
            <HomeQuickActions
              onHelpMePick={startWizard}
              captureValue={capture}
              onCaptureChange={setCapture}
              onQuickCapture={(text) => backlog.add(text)}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <HelpMePickModal
        step={wizardStep}
        choices={wizardChoices}
        onClose={() => setWizardStep('closed')}
        onPickEnergy={pickEnergy}
        onPickChoice={pickChoice}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { paddingBottom: 24 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.textMuted },
});
