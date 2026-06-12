export const MODE_OPTIONS = [
  { value: 'personal', label: '☀️ Personal' },
  { value: 'work', label: '💻 Work' },
  { value: 'school', label: '📚 School' },
  { value: 'other', label: '🔧 Other' },
] as const;

export type Mode = (typeof MODE_OPTIONS)[number]['value'];
export type EnergyTag = 'quick_win' | 'deep_focus' | 'boring_grind';
export type WizardStep = 'closed' | 'energy' | 'pick';

export const ENERGY_LABELS: Record<EnergyTag, string> = {
  quick_win: 'Quick Win',
  deep_focus: 'Deep Focus',
  boring_grind: 'Boring Grind',
};

export const ENERGY_EMOJI: Record<EnergyTag, string> = {
  quick_win: '⚡',
  deep_focus: '🧠',
  boring_grind: '🥱',
};

export const QUOTES = [
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

export function getDailyQuoteIndex() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return dayOfYear % QUOTES.length;
}
