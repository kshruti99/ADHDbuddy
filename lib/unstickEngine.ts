export type UnstickCategory =
  | 'email'
  | 'cleaning'
  | 'studying'
  | 'work'
  | 'paperwork'
  | 'phone_call'
  | 'default';

export type ClarifyQuestion = {
  question: string;
  options: { label: string; value: string }[];
};

export function detectClarify(task: string): ClarifyQuestion | null {
  const lower = task.toLowerCase();
  if (
    /\b(\d{1,2}:\d{2}|am|pm|deadline|appointment|meeting|by \d|due|tonight|tomorrow|today at)\b/i.test(
      task
    )
  ) {
    return {
      question: 'Is this about getting ready for something, or doing something?',
      options: [
        { label: 'Getting ready (time-bound)', value: 'plan' },
        { label: 'Doing the thing itself', value: 'unstick' },
      ],
    };
  }
  if (lower.includes('email') || lower.includes('message') || lower.includes('reply')) {
    return {
      question: 'Is the hard part writing it or sending it?',
      options: [
        { label: 'Writing it', value: 'writing' },
        { label: 'Sending it', value: 'sending' },
      ],
    };
  }
  if (lower.includes('clean') || lower.includes('tidy') || lower.includes('mess')) {
    return {
      question: 'Is the blocker starting or finishing?',
      options: [
        { label: 'Starting', value: 'starting' },
        { label: 'Finishing', value: 'finishing' },
      ],
    };
  }
  return null;
}

function extractSubject(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 60) return trimmed;
  const firstSentence = trimmed.split(/[.!?]/)[0];
  return firstSentence.length > 10 ? firstSentence : trimmed.slice(0, 60);
}

export function detectCategory(task: string, clarifyValue?: string): UnstickCategory {
  const lower = task.toLowerCase();
  if (clarifyValue === 'writing' || clarifyValue === 'sending') return 'email';
  if (clarifyValue === 'starting' || clarifyValue === 'finishing') return 'cleaning';
  if (lower.includes('email') || lower.includes('message') || lower.includes('reply')) return 'email';
  if (lower.includes('clean') || lower.includes('tidy') || lower.includes('mess') || lower.includes('dishes'))
    return 'cleaning';
  if (lower.includes('study') || lower.includes('homework') || lower.includes('class')) return 'studying';
  if (
    lower.includes('paperwork') ||
    lower.includes('form') ||
    lower.includes('application') ||
    lower.includes('document')
  )
    return 'paperwork';
  if (lower.includes('call') || lower.includes('phone') || lower.includes('appointment')) return 'phone_call';
  if (lower.includes('work') || lower.includes('project') || lower.includes('report')) return 'work';
  return 'default';
}

const EASIER_STEP1 = [
  'Stand up and stretch for 10 seconds — that counts',
  'Put your phone face-down on the table',
  'Clear a small space in front of you — just push stuff aside',
  'Take one deep breath and unclench your jaw',
];

export function buildSteps(task: string, category: UnstickCategory, clarifyValue?: string): string[] {
  const subject = extractSubject(task);

  const templates: Record<UnstickCategory, [string, string, string]> = {
    email: [
      'Put your phone face-down and close every tab except email',
      clarifyValue === 'sending'
        ? `Open the draft for "${subject}" — don't edit, just find the Send button`
        : `Open a blank reply about "${subject}" — type one sentence only, then stop`,
      'Read that one sentence out loud. Does it say what you need? Yes? Good enough.',
    ],
    cleaning: [
      clarifyValue === 'finishing'
        ? 'Walk to the spot that is almost done — stand there for 10 seconds'
        : "Stand up and walk to the messiest spot — don't touch anything yet",
      'Pick up exactly three items and put each where it belongs',
      'Look at that spot — is it even slightly better? That is enough for now.',
    ],
    studying: [
      'Put your phone in another room or on silent across the room',
      `Open to the section for "${subject}" — don't read yet, just have it open`,
      'Read just the first sentence. That is all. One sentence.',
    ],
    work: [
      'Close every app and tab except the one you need — one screen, one thing',
      `Find the file or doc for "${subject}" and open only that`,
      'Read just the title or first line — what is this actually about?',
    ],
    paperwork: [
      'Clear your desk — push everything to one side for a blank workspace',
      `Gather everything related to "${subject}" into one pile — don't sort, just stack`,
      "Find the one document with a deadline — put it on top. Locate it, don't fill it.",
    ],
    phone_call: [
      'Write the phone number on a sticky note and stick it to your screen',
      `Write one sentence you need to say about "${subject}"`,
      'Check: do you have your reference number ready? That is all you need.',
    ],
    default: [
      'Clear a small space on your desk — push everything to one side',
      `Find the one specific thing you need for "${subject}" and put it in front of you`,
      'Check: do you have that one thing ready? Yes? You are set.',
    ],
  };

  return templates[category];
}

export function buildEasierStep1(): string {
  return EASIER_STEP1[Math.floor(Math.random() * EASIER_STEP1.length)];
}
