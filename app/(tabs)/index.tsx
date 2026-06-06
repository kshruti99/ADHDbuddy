import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle,
  Circle,
  Sparkles,
  Zap,
  Brain,
  Coffee,
  Clock,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Trash2,
  MoveRight,
  Edit3,
  Save,
  Expand,
} from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '@/lib/colors';
import { supabase } from '@/lib/supabase';
import { SwipeableRow } from '@/components/SwipeableRow';
import type { FocusItem, BacklogItem, AnchorItem } from '@/lib/supabase';

const QUOTES = [
  "One step at a time. Let's clear the fog together.",
  "You don't have to do it all. Just the next right thing.",
  'Progress over perfection. Always.',
  "It's okay that your brain works differently.",
  "We're just doing 5 minutes. That's enough.",
  'You showed up today. That counts.',
  'Rest is not the enemy of productivity.',
  'You are not your to-do list.',
  'Done is better than perfect.',
  'Being gentle with yourself is a superpower.',
  'Your effort matters, even when it feels small.',
  "It's okay to start over. As many times as you need.",
  'Small steps still move you forward.',
  'You deserve space to breathe.',
  'Not everything has to be figured out today.',
  'You are doing better than you think.',
  'Take it one breath at a time.',
  'Your pace is the right pace.',
];

const ENERGY_LABELS: Record<string, string> = {
  quick_win: 'Quick Win',
  deep_focus: 'Deep Focus',
  boring_grind: 'Boring Grind',
};

const ENERGY_EMOJI: Record<string, string> = {
  quick_win: '⚡',
  deep_focus: '🧠',
  boring_grind: '🥱',
};

const MODE_OPTIONS = [
  { value: 'personal', label: '☀️ Personal' },
  { value: 'work', label: '💻 Work' },
  { value: 'school', label: '📚 School' },
  { value: 'other', label: '🔧 Other' },
] as const;

type Mode = (typeof MODE_OPTIONS)[number]['value'];
type WizardStep = 'closed' | 'energy' | 'pick';
type EnergyTag = 'quick_win' | 'deep_focus' | 'boring_grind';

const screenHeight = Dimensions.get('window').height;

// Scroll position where quote zone ends and content begins
const QUOTE_ZONE_HEIGHT = screenHeight - 100;
// Cards start becoming visible at this scroll offset
const FADE_START = QUOTE_ZONE_HEIGHT - 120;
const FADE_END = QUOTE_ZONE_HEIGHT - 20;

function getDailyQuoteIndex() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return dayOfYear % QUOTES.length;
}

function getNextAnchor(anchors: AnchorItem[]): AnchorItem | null {
  const now = new Date();
  let next: AnchorItem | null = null;
  let nextMinutes = Infinity;
  for (const a of anchors) {
    const match = a.anchor_time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) continue;
    let hours = parseInt(match[1]);
    const mins = parseInt(match[2]);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    const anchorDate = new Date();
    anchorDate.setHours(hours, mins, 0, 0);
    const diff = anchorDate.getTime() - now.getTime();
    if (diff > 0 && diff < nextMinutes) {
      nextMinutes = diff;
      next = a;
    }
  }
  return next;
}

export default function HomeScreen() {
  const [mode, setMode] = useState<Mode>('personal');
  const [modeOpen, setModeOpen] = useState(false);
  const quoteIdx = useRef(getDailyQuoteIndex()).current;

  const [focusItems, setFocusItems] = useState<FocusItem[]>([]);
  const [focusInput, setFocusInput] = useState('');
  const [focusOverflow, setFocusOverflow] = useState<string | null>(null);

  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [backlogInput, setBacklogInput] = useState('');
  const [backlogEnergy, setBacklogEnergy] = useState<EnergyTag>('quick_win');
  const [backlogExpanded, setBacklogExpanded] = useState(false);

  const [anchors, setAnchors] = useState<AnchorItem[]>([]);
  const [anchorModal, setAnchorModal] = useState(false);
  const [anchorExpanded, setAnchorExpanded] = useState(false);
  const [editingAnchor, setEditingAnchor] = useState<AnchorItem | null>(null);
  const [anchorTitle, setAnchorTitle] = useState('');
  const [anchorTime, setAnchorTime] = useState('');
  const [anchorCommute, setAnchorCommute] = useState('');
  const [anchorPrep, setAnchorPrep] = useState('');

  const [wizardStep, setWizardStep] = useState<WizardStep>('closed');
  const [wizardEnergy, setWizardEnergy] = useState<EnergyTag | null>(null);
  const [wizardChoices, setWizardChoices] = useState<BacklogItem[]>([]);

  const [loading, setLoading] = useState(true);

  // Scroll-driven opacity for content sections
  const contentOpacity = useSharedValue(0);
  const gradientOpacity = useSharedValue(0);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const fade = Math.min(1, Math.max(0, (y - FADE_START) / (FADE_END - FADE_START)));
    contentOpacity.value = withTiming(fade, { duration: 80 });
    // Gradient mask fades as user scrolls past quote zone
    const gradFade = Math.min(1, Math.max(0, y / (QUOTE_ZONE_HEIGHT * 0.5)));
    gradientOpacity.value = gradFade;
  }, []);

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const gradientAnimStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  }));

  // ─── Load data ──────────────────────────────────────────

  const loadFocus = useCallback(async () => {
    const { data, error } = await supabase
      .from('current_focus')
      .select('*')
      .eq('mode', mode)
      .order('position');
    if (data) setFocusItems(data as FocusItem[]);
    if (error) console.error('loadFocus error:', error);
  }, [mode]);

  const loadBacklog = useCallback(async () => {
    const { data, error } = await supabase
      .from('brain_backlog')
      .select('*')
      .eq('mode', mode)
      .order('created_at', { ascending: false });
    if (data) setBacklogItems(data as BacklogItem[]);
    if (error) console.error('loadBacklog error:', error);
  }, [mode]);

  const loadAnchors = useCallback(async () => {
    const { data, error } = await supabase
      .from('anchors')
      .select('*')
      .order('anchor_time');
    if (data) setAnchors(data as AnchorItem[]);
    if (error) console.error('loadAnchors error:', error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([loadFocus(), loadBacklog(), loadAnchors()]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [mode, loadFocus, loadBacklog, loadAnchors]);

  // ─── Current Focus ──────────────────────────────────────

  async function addFocus() {
    if (!focusInput.trim()) return;
    if (focusItems.filter((f) => !f.completed).length >= 3) {
      setFocusOverflow(focusInput.trim());
      setFocusInput('');
      return;
    }
    const { data } = await supabase
      .from('current_focus')
      .insert({ content: focusInput.trim(), mode, position: focusItems.length })
      .select()
      .maybeSingle();
    if (data) setFocusItems((prev) => [...prev, data as FocusItem]);
    setFocusInput('');
  }

  async function toggleFocus(item: FocusItem) {
    const updated = !item.completed;
    await supabase.from('current_focus').update({ completed: updated }).eq('id', item.id);
    setFocusItems((prev) => prev.map((f) => (f.id === item.id ? { ...f, completed: updated } : f)));
  }

  async function removeFocus(item: FocusItem) {
    await supabase.from('current_focus').delete().eq('id', item.id);
    setFocusItems((prev) => prev.filter((f) => f.id !== item.id));
  }

  async function moveToBacklog(content: string) {
    await supabase.from('brain_backlog').insert({ content, mode, energy_tag: 'quick_win' });
    setFocusOverflow(null);
    loadBacklog();
  }

  // ─── Brain Backlog ──────────────────────────────────────

  async function addBacklog() {
    if (!backlogInput.trim()) return;
    const { data } = await supabase
      .from('brain_backlog')
      .insert({ content: backlogInput.trim(), mode, energy_tag: backlogEnergy })
      .select()
      .maybeSingle();
    if (data) setBacklogItems((prev) => [data as BacklogItem, ...prev]);
    setBacklogInput('');
  }

  async function toggleBacklog(item: BacklogItem) {
    const updated = !item.completed;
    await supabase.from('brain_backlog').update({ completed: updated }).eq('id', item.id);
    setBacklogItems((prev) => prev.map((b) => (b.id === item.id ? { ...b, completed: updated } : b)));
  }

  async function deleteBacklog(item: BacklogItem) {
    await supabase.from('brain_backlog').delete().eq('id', item.id);
    setBacklogItems((prev) => prev.filter((b) => b.id !== item.id));
  }

  async function promoteToFocus(item: BacklogItem) {
    const activeCount = focusItems.filter((f) => !f.completed).length;
    if (activeCount >= 3) {
      setFocusOverflow(item.content);
      return;
    }
    await supabase.from('current_focus').insert({ content: item.content, mode, position: focusItems.length });
    await supabase.from('brain_backlog').delete().eq('id', item.id);
    loadFocus();
    loadBacklog();
  }

  // ─── Help Me Pick wizard ───────────────────────────────

  function startWizard() {
    setWizardStep('energy');
    setWizardEnergy(null);
    setWizardChoices([]);
  }

  function pickEnergy(energy: EnergyTag) {
    setWizardEnergy(energy);
    const matches = backlogItems.filter((b) => !b.completed && b.energy_tag === energy);
    const shuffled = [...matches].sort(() => Math.random() - 0.5);
    setWizardChoices(shuffled.slice(0, 2));
    setWizardStep('pick');
  }

  async function pickChoice(item: BacklogItem) {
    await promoteToFocus(item);
    setWizardStep('closed');
  }

  // ─── Anchors ───────────────────────────────────────────

  function openAnchorEditor(anchor?: AnchorItem) {
    if (anchor) {
      setEditingAnchor(anchor);
      setAnchorTitle(anchor.title);
      setAnchorTime(anchor.anchor_time);
      setAnchorCommute(String(anchor.commute_min));
      setAnchorPrep(String(anchor.prep_min));
    } else {
      setEditingAnchor(null);
      setAnchorTitle('');
      setAnchorTime('');
      setAnchorCommute('15');
      setAnchorPrep('10');
    }
    setAnchorModal(true);
  }

  async function saveAnchor() {
    if (!anchorTitle.trim() || !anchorTime.trim()) return;
    const commute = parseInt(anchorCommute) || 0;
    const prep = parseInt(anchorPrep) || 0;
    if (editingAnchor) {
      await supabase
        .from('anchors')
        .update({ title: anchorTitle.trim(), anchor_time: anchorTime.trim(), commute_min: commute, prep_min: prep })
        .eq('id', editingAnchor.id);
    } else {
      await supabase
        .from('anchors')
        .insert({ title: anchorTitle.trim(), anchor_time: anchorTime.trim(), commute_min: commute, prep_min: prep });
    }
    setAnchorModal(false);
    loadAnchors();
  }

  async function deleteAnchor(anchor: AnchorItem) {
    await supabase.from('anchors').delete().eq('id', anchor.id);
    setAnchors((prev) => prev.filter((a) => a.id !== anchor.id));
  }

  function calcBuffer(anchor: AnchorItem) {
    const match = anchor.anchor_time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return;
    let hours = parseInt(match[1]);
    const mins = parseInt(match[2]);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    const totalBuffer = anchor.commute_min + anchor.prep_min;
    const anchorDate = new Date();
    anchorDate.setHours(hours, mins, 0, 0);
    const feetTime = new Date(anchorDate.getTime() - totalBuffer * 60000);
    const h = feetTime.getHours();
    const m = feetTime.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const feetStr = `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
    supabase
      .from('anchors')
      .update({ feet_on_floor_time: feetStr })
      .eq('id', anchor.id)
      .then(() => {
        setAnchors((prev) => prev.map((a) => (a.id === anchor.id ? { ...a, feet_on_floor_time: feetStr } : a)));
      });
  }

  // ─── Derived ────────────────────────────────────────────

  const activeFocus = focusItems.filter((f) => !f.completed);
  const completedFocus = focusItems.filter((f) => f.completed);
  const incompleteBacklog = backlogItems.filter((b) => !b.completed);
  const displayedBacklog = backlogExpanded ? incompleteBacklog : incompleteBacklog.slice(0, 3);
  const currentModeLabel = MODE_OPTIONS.find((m) => m.value === mode)?.label || mode;
  const nextAnchor = getNextAnchor(anchors);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your space...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          onScroll={handleScroll}
          scrollEventThrottle={16}>
          {/* ─── Full-Screen Reassurance Quote ──────────────── */}
          <View style={[styles.quoteHero, { minHeight: screenHeight - 100 }]}>
            <View style={styles.quoteContent}>
              <Text style={styles.quoteSparkle}>✦</Text>
              <Text style={styles.quoteText}>{QUOTES[quoteIdx]}</Text>
              <Text style={styles.quoteSparkle}>✦</Text>
            </View>
          </View>

          {/* ─── Gradient Mask Overlay ──────────────────────── */}
          <Animated.View style={[styles.gradientMask, gradientAnimStyle]} pointerEvents="none" />

          {/* ─── Scroll-Driven Content ──────────────────────── */}
          <Animated.View style={contentAnimStyle}>
            {/* ─── Mode Dropdown ─────────────────────────────── */}
            <View style={styles.modeRow}>
              <Text style={styles.modeLabel}>MODE</Text>
              <View style={styles.modeDropdownWrap}>
                <TouchableOpacity
                  style={styles.modeDropdownBtn}
                  onPress={() => setModeOpen((o) => !o)}
                  activeOpacity={0.8}>
                  <Text style={styles.modeDropdownText}>{currentModeLabel}</Text>
                  <ChevronDown
                    size={16}
                    color={colors.textMuted}
                    strokeWidth={2}
                    style={{ transform: [{ rotate: modeOpen ? '180deg' : '0deg' }] }}
                  />
                </TouchableOpacity>
                {modeOpen && (
                  <View style={styles.modeDropdownList}>
                    {MODE_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.modeDropdownItem, mode === opt.value && styles.modeDropdownItemActive]}
                        onPress={() => {
                          setMode(opt.value as Mode);
                          setBacklogExpanded(false);
                          setModeOpen(false);
                        }}
                        activeOpacity={0.7}>
                        <Text style={[styles.modeDropdownItemText, mode === opt.value && styles.modeDropdownItemTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* ─── Current Focus ──────────────────────────────── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Current Focus</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{activeFocus.length}/3</Text>
                </View>
              </View>

              {activeFocus.map((item) => (
                <SwipeableRow key={item.id} onDelete={() => removeFocus(item)}>
                  <View style={styles.taskRow}>
                    <TouchableOpacity onPress={() => toggleFocus(item)} activeOpacity={0.7} style={styles.checkBtn}>
                      <Circle size={22} color={colors.primary} strokeWidth={2} />
                    </TouchableOpacity>
                    <Text style={styles.focusText}>{item.content}</Text>
                  </View>
                </SwipeableRow>
              ))}

              {completedFocus.map((item) => (
                <SwipeableRow key={item.id} onDelete={() => removeFocus(item)}>
                  <View style={[styles.taskRow, styles.taskRowDone]}>
                    <TouchableOpacity onPress={() => toggleFocus(item)} activeOpacity={0.7} style={styles.checkBtn}>
                      <CheckCircle size={22} color={colors.success} strokeWidth={2} />
                    </TouchableOpacity>
                    <Text style={styles.focusTextDone}>{item.content}</Text>
                  </View>
                </SwipeableRow>
              ))}

              {activeFocus.length < 3 && (
                <TextInput
                  style={styles.inlineAddInput}
                  value={focusInput}
                  onChangeText={setFocusInput}
                  placeholder="+ Add a focus item..."
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={addFocus}
                  returnKeyType="done"
                />
              )}

              {incompleteBacklog.length > 0 && (
                <TouchableOpacity style={styles.helpPickBtn} onPress={startWizard} activeOpacity={0.8}>
                  <Sparkles size={16} color={colors.accent} strokeWidth={2} />
                  <Text style={styles.helpPickText}>Help Me Pick</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ─── Focus Overflow Prompt ──────────────────────── */}
            {focusOverflow && (
              <View style={styles.overflowCard}>
                <View style={styles.overflowHeader}>
                  <AlertTriangle size={16} color={colors.accent} strokeWidth={2} />
                  <Text style={styles.overflowTitle}>Your current focus is full!</Text>
                </View>
                <Text style={styles.overflowText}>
                  Would you like to save &quot;{focusOverflow}&quot; to your Brain Backlog instead?
                </Text>
                <View style={styles.overflowActions}>
                  <TouchableOpacity style={styles.overflowYesBtn} onPress={() => moveToBacklog(focusOverflow)} activeOpacity={0.8}>
                    <MoveRight size={14} color={colors.black} strokeWidth={2.5} />
                    <Text style={styles.overflowYesText}>Yes, move to Backlog</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setFocusOverflow(null)} style={styles.overflowNoBtn}>
                    <Text style={styles.overflowNoText}>No thanks</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ─── Brain Backlog ──────────────────────────────── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Brain Backlog</Text>
                <Text style={styles.sectionCount}>{incompleteBacklog.length} items</Text>
              </View>

              {displayedBacklog.map((item) => (
                <SwipeableRow key={item.id} onDelete={() => deleteBacklog(item)}>
                  <View style={styles.taskRow}>
                    <TouchableOpacity onPress={() => toggleBacklog(item)} activeOpacity={0.7} style={styles.checkBtn}>
                      <Circle size={18} color={colors.textMuted} strokeWidth={1.5} />
                    </TouchableOpacity>
                    <View style={styles.backlogContent}>
                      <Text style={styles.backlogText}>{item.content}</Text>
                      <Text style={styles.backlogTag}>
                        {ENERGY_EMOJI[item.energy_tag]} {ENERGY_LABELS[item.energy_tag]}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => promoteToFocus(item)} style={styles.promoteBtn} activeOpacity={0.7}>
                      <ChevronRight size={14} color={colors.primary} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </SwipeableRow>
              ))}

              {incompleteBacklog.length === 0 && (
                <Text style={styles.emptyText}>Nothing here yet. Add something below!</Text>
              )}

              {incompleteBacklog.length > 3 && (
                <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={() => setBacklogExpanded((e) => !e)}
                  activeOpacity={0.7}>
                  <Expand size={14} color={colors.textMuted} strokeWidth={2} />
                  <Text style={styles.expandText}>
                    {backlogExpanded ? 'Show less' : `See all ${incompleteBacklog.length} items`}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Inline add with energy tags */}
              <View style={styles.backlogInputSection}>
                <View style={styles.energyPicker}>
                  {(['quick_win', 'deep_focus', 'boring_grind'] as EnergyTag[]).map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.energyChip, backlogEnergy === tag && styles.energyChipActive]}
                      onPress={() => setBacklogEnergy(tag)}
                      activeOpacity={0.7}>
                      <Text style={[styles.energyChipText, backlogEnergy === tag && styles.energyChipTextActive]}>
                        {ENERGY_EMOJI[tag]} {ENERGY_LABELS[tag]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.inlineAddInput}
                  value={backlogInput}
                  onChangeText={setBacklogInput}
                  placeholder="+ Add to backlog..."
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={addBacklog}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* ─── Anchor Ticker ──────────────────────────────── */}
            <View style={styles.tickerCard}>
              <View style={styles.tickerHeader}>
                <Text style={styles.tickerBadge}>🛑</Text>
                {nextAnchor ? (
                  <TouchableOpacity
                    style={styles.tickerContent}
                    onPress={() => setAnchorExpanded((e) => !e)}
                    activeOpacity={0.7}>
                    <Text style={styles.tickerNextLabel}>Up Next</Text>
                    <Text style={styles.tickerNextTime}>{nextAnchor.anchor_time}</Text>
                    <Text style={styles.tickerNextTitle}>{nextAnchor.title}</Text>
                    {anchors.length > 1 && (
                      <Text style={styles.tickerMore}>{anchorExpanded ? 'Close' : `${anchors.length} total`}</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.tickerContent}>
                    <Text style={styles.tickerEmpty}>No anchors today</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.tickerAddBtn} onPress={() => openAnchorEditor()} activeOpacity={0.7}>
                  <Text style={styles.tickerAddBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {anchorExpanded && (
                <View style={styles.anchorExpanded}>
                  {anchors.map((anchor) => (
                    <View key={anchor.id} style={styles.anchorRow}>
                      <View style={styles.anchorBadge}>
                        <Text style={styles.anchorBadgeIcon}>🛑</Text>
                      </View>
                      <View style={styles.anchorContent}>
                        <Text style={styles.anchorTitle}>{anchor.title}</Text>
                        <Text style={styles.anchorTime}>{anchor.anchor_time}</Text>
                        <Text style={styles.anchorBufferInfo}>
                          Commute: {anchor.commute_min}m · Prep: {anchor.prep_min}m
                        </Text>
                        {anchor.feet_on_floor_time && (
                          <View style={styles.feetRow}>
                            <Clock size={12} color={colors.success} strokeWidth={2} />
                            <Text style={styles.feetText}>Feet on floor: {anchor.feet_on_floor_time}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.anchorActions}>
                        <TouchableOpacity style={styles.bufferBtn} onPress={() => calcBuffer(anchor)} activeOpacity={0.8}>
                          <Clock size={12} color={colors.primary} strokeWidth={2} />
                          <Text style={styles.bufferBtnText}>Buffer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.anchorEditBtn} onPress={() => openAnchorEditor(anchor)} activeOpacity={0.7}>
                          <Edit3 size={14} color={colors.textMuted} strokeWidth={2} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.anchorEditBtn} onPress={() => deleteAnchor(anchor)} activeOpacity={0.7}>
                          <Trash2 size={14} color={colors.textMuted} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.footerSpace} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* ─── Help Me Pick Wizard Modal ─────────────────────── */}
      <Modal visible={wizardStep !== 'closed'} transparent animationType="slide" onRequestClose={() => setWizardStep('closed')}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setWizardStep('closed')}>
          <TouchableOpacity style={styles.bottomSheet} activeOpacity={1}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Sparkles size={20} color={colors.accent} strokeWidth={2} />
              <Text style={styles.sheetTitle}>Help Me Pick</Text>
              <TouchableOpacity onPress={() => setWizardStep('closed')}>
                <Text style={styles.sheetClose}>Done</Text>
              </TouchableOpacity>
            </View>

            {wizardStep === 'energy' && (
              <View style={styles.sheetBody}>
                <Text style={styles.wizardQuestion}>What is your mental energy level right now?</Text>
                <TouchableOpacity style={styles.energyPickBtn} onPress={() => pickEnergy('quick_win')} activeOpacity={0.8}>
                  <Zap size={18} color={colors.accent} strokeWidth={2} />
                  <Text style={styles.energyPickText}>Ready for a Quick Win</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.energyPickBtn} onPress={() => pickEnergy('deep_focus')} activeOpacity={0.8}>
                  <Brain size={18} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.energyPickText}>In Deep Focus Mode</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.energyPickBtn} onPress={() => pickEnergy('boring_grind')} activeOpacity={0.8}>
                  <Coffee size={18} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.energyPickText}>Dragging through a Boring Grind</Text>
                </TouchableOpacity>
              </View>
            )}

            {wizardStep === 'pick' && (
              <View style={styles.sheetBody}>
                <Text style={styles.wizardQuestion}>
                  If you could only finish ONE of these today, which one relieves the most pressure?
                </Text>
                {wizardChoices.length === 0 && (
                  <Text style={styles.wizardEmpty}>
                    No matching items in your Brain Backlog for this energy level. Try adding some first!
                  </Text>
                )}
                {wizardChoices.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.wizardChoiceBtn} onPress={() => pickChoice(item)} activeOpacity={0.8}>
                    <Text style={styles.wizardChoiceText}>{item.content}</Text>
                    <ChevronRight size={16} color={colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.wizardSkipBtn} onPress={() => setWizardStep('closed')} activeOpacity={0.7}>
                  <Text style={styles.wizardSkipText}>Neither — skip for now</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── Anchor Editor Modal ───────────────────────────── */}
      <Modal visible={anchorModal} transparent animationType="slide" onRequestClose={() => setAnchorModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAnchorModal(false)}>
          <TouchableOpacity style={styles.bottomSheet} activeOpacity={1}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Clock size={20} color={colors.primary} strokeWidth={2} />
              <Text style={styles.sheetTitle}>{editingAnchor ? 'Edit Anchor' : 'New Anchor'}</Text>
              <TouchableOpacity onPress={() => setAnchorModal(false)}>
                <Text style={styles.sheetClose}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sheetBody}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Event name</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={anchorTitle}
                  onChangeText={setAnchorTitle}
                  placeholder="e.g. Team Standup"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Time (e.g. 10:00 AM)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={anchorTime}
                  onChangeText={setAnchorTime}
                  placeholder="10:00 AM"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.fieldRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Commute (min)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={anchorCommute}
                    onChangeText={setAnchorCommute}
                    placeholder="15"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Prep (min)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={anchorPrep}
                    onChangeText={setAnchorPrep}
                    placeholder="10"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, (!anchorTitle.trim() || !anchorTime.trim()) && styles.saveBtnDisabled]}
                onPress={saveAnchor}
                disabled={!anchorTitle.trim() || !anchorTime.trim()}
                activeOpacity={0.8}>
                <Save size={16} color={(!anchorTitle.trim() || !anchorTime.trim()) ? colors.textMuted : colors.black} strokeWidth={2.5} />
                <Text style={[styles.saveBtnText, (!anchorTitle.trim() || !anchorTime.trim()) && styles.saveBtnTextDisabled]}>
                  {editingAnchor ? 'Update Anchor' : 'Add Anchor'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { paddingBottom: 24 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.textMuted },

  // ─── Quote Hero ─────────────────────────────────────────
  quoteHero: {
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteContent: {
    alignItems: 'center',
    gap: 14,
  },
  quoteSparkle: {
    fontSize: 14,
    color: colors.primary,
    opacity: 0.4,
    letterSpacing: 6,
  },
  quoteText: {
    fontSize: 26,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: 0.3,
  },

  // ─── Gradient Mask at quote/dashboard boundary ──────────
  gradientMask: {
    position: 'absolute',
    top: screenHeight - 200,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 5,
    // Gradient from bg (opaque) to transparent, creating feathered dissolve
    ...(Platform.OS === 'web'
      ? {
          backgroundImage: `linear-gradient(to bottom, ${colors.bg}, transparent)`,
        }
      : {
          // On native, use a series of overlapping views
          backgroundColor: colors.bg,
          opacity: 0.7,
        }),
  },

  // ─── Mode Dropdown ─────────────────────────────────────
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modeLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  modeDropdownWrap: {
    position: 'relative',
    zIndex: 10,
  },
  modeDropdownBtn: {
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
  modeDropdownText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
  },
  modeDropdownList: {
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
  modeDropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeDropdownItemActive: {
    backgroundColor: colors.primaryMuted,
  },
  modeDropdownItemText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  modeDropdownItemTextActive: {
    color: colors.primaryLight,
  },

  // ─── Section Card ──────────────────────────────────────
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  sectionBadge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: colors.primaryLight,
  },
  sectionCount: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },

  // ─── Task Rows ──────────────────────────────────────────
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingRight: 8,
  },
  taskRowDone: { opacity: 0.5 },
  checkBtn: { padding: 2 },
  focusText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  focusTextDone: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  promoteBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Inline Add Input ───────────────────────────────────
  inlineAddInput: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 0,
  },

  // ─── Help Me Pick ───────────────────────────────────────
  helpPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.accent + '44',
    borderStyle: 'dashed',
  },
  helpPickText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: colors.accent,
  },

  // ─── Overflow ───────────────────────────────────────────
  overflowCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent + '55',
    padding: 18,
    gap: 10,
  },
  overflowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overflowTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: colors.accent,
  },
  overflowText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  overflowActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  overflowYesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  overflowYesText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: colors.black,
  },
  overflowNoBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  overflowNoText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },

  // ─── Brain Backlog ──────────────────────────────────────
  backlogContent: { flex: 1, gap: 2 },
  backlogText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  backlogTag: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },

  // ─── Backlog Input Section ──────────────────────────────
  backlogInputSection: {
    marginTop: 8,
    gap: 8,
  },
  energyPicker: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  energyChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  energyChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  energyChipText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  energyChipTextActive: {
    color: colors.primaryLight,
  },

  // ─── Expand Button ──────────────────────────────────────
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expandText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },

  // ─── Anchor Ticker ──────────────────────────────────────
  tickerCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  tickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tickerBadge: { fontSize: 18 },
  tickerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tickerNextLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: colors.accent,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tickerNextTime: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  tickerNextTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    numberOfLines: 1,
  } as any,
  tickerMore: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  tickerEmpty: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  tickerAddBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickerAddBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_300Light',
    color: colors.primaryLight,
    marginTop: -2,
  },

  // ─── Expanded Anchors ───────────────────────────────────
  anchorExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  anchorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  anchorBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anchorBadgeIcon: { fontSize: 14 },
  anchorContent: { flex: 1, gap: 1 },
  anchorTitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
  },
  anchorTime: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  anchorBufferInfo: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  feetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  feetText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: colors.success,
  },
  anchorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bufferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bufferBtnText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: colors.primary,
  },
  anchorEditBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerSpace: { height: 24 },

  // ─── Shared Modal Styles ────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  sheetClose: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.primary,
  },
  sheetBody: { gap: 12 },

  // ─── Wizard Specific ────────────────────────────────────
  wizardQuestion: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 4,
  },
  energyPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  energyPickText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
  },
  wizardChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.accent + '44',
    padding: 16,
    gap: 12,
  },
  wizardChoiceText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  wizardSkipBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  wizardSkipText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  wizardEmpty: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingVertical: 12,
  },

  // ─── Anchor Editor Fields ───────────────────────────────
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  fieldRow: { flexDirection: 'row' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  saveBtnDisabled: { backgroundColor: colors.surfaceHighlight },
  saveBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: colors.black,
  },
  saveBtnTextDisabled: { color: colors.textMuted },
});
