// This engine acts like an ADHD coach. It takes any goal — broad, vague, or
// overwhelming — and returns tiny, low-friction micro-steps.
//
// Guiding rules:
// 1. Never assume a physical object, book section, or website exists with the
//    exact name of the user's prompt (no "Open to the section for X").
// 2. For massive multi-week goals, don't outline the whole plan — just help the
//    user start *right now* with a ~15-minute micro-task.
// 3. Keep steps action-oriented and concrete. Real-world examples are fine when
//    they're common knowledge (LeetCode, docs, a code editor).
// 4. Empathize with executive dysfunction — step one should take almost zero
//    mental effort.

export type UnstuckCategory =
  | 'email'
  | 'cleaning'
  | 'studying'
  | 'coding'
  | 'writing'
  | 'work'
  | 'paperwork'
  | 'phone_call'
  | 'errand'
  | 'health'
  | 'decision'
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
        { label: 'Doing the thing itself', value: 'unstuck' },
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

// Signals that the goal is a large, multi-week undertaking rather than a single
// task. When detected, we don't plan the whole thing — we just help start now.
const BIG_PROJECT_PATTERNS = [
  /\binterview(s)?\b/,
  /\bstudy(ing)? for\b/,
  /\bprep(are|aring)? for\b/,
  /\blearn(ing)?\b/,
  /\bget (good|better|fluent)\b/,
  /\bbecome\b/,
  /\bmaster\b/,
  /\bthesis\b/,
  /\bdissertation\b/,
  /\bstartup\b/,
  /\blaunch\b/,
  /\bbuild (a|an|my)\b/,
  /\bportfolio\b/,
  /\bbootcamp\b/,
  /\bcertification\b|\bcertified\b/,
  /\bexam(s)?\b|\bfinals\b|\bmidterm/,
  /\b(job|career) (search|hunt|change)\b/,
  /\bfind a job\b/,
  /\bnovel\b|\bwrite a book\b/,
  /\bmarathon\b/,
  /\bdegree\b|\bsemester\b/,
  /\b(whole|entire|all of) (it|this|my)\b/,
  /\bmy life\b/,
  /\bget my life together\b/,
];

export function isBigProject(task: string): boolean {
  const lower = task.toLowerCase();
  return BIG_PROJECT_PATTERNS.some((re) => re.test(lower));
}

export function detectCategory(task: string, clarifyValue?: string): UnstuckCategory {
  const lower = task.toLowerCase();
  if (clarifyValue === 'writing' || clarifyValue === 'sending') return 'email';
  if (clarifyValue === 'starting' || clarifyValue === 'finishing') return 'cleaning';

  if (lower.includes('email') || lower.includes('message') || lower.includes('reply')) return 'email';
  if (
    lower.includes('clean') ||
    lower.includes('tidy') ||
    lower.includes('mess') ||
    lower.includes('dishes') ||
    lower.includes('laundry') ||
    lower.includes('room')
  )
    return 'cleaning';
  if (
    lower.includes('code') ||
    lower.includes('coding') ||
    lower.includes('program') ||
    lower.includes('leetcode') ||
    lower.includes('bug') ||
    lower.includes('app') ||
    lower.includes('feature') ||
    lower.includes('software') ||
    lower.includes('engineer')
  )
    return 'coding';
  if (
    lower.includes('study') ||
    lower.includes('homework') ||
    lower.includes('class') ||
    lower.includes('exam') ||
    lower.includes('test') ||
    lower.includes('read') ||
    lower.includes('learn')
  )
    return 'studying';
  if (
    lower.includes('write') ||
    lower.includes('essay') ||
    lower.includes('blog') ||
    lower.includes('post') ||
    lower.includes('draft') ||
    lower.includes('thesis')
  )
    return 'writing';
  if (
    lower.includes('paperwork') ||
    lower.includes('form') ||
    lower.includes('application') ||
    lower.includes('document') ||
    lower.includes('taxes') ||
    lower.includes('invoice')
  )
    return 'paperwork';
  if (lower.includes('call') || lower.includes('phone') || lower.includes('appointment')) return 'phone_call';
  if (
    lower.includes('errand') ||
    lower.includes('grocer') ||
    lower.includes('store') ||
    lower.includes('shop') ||
    lower.includes('pick up') ||
    lower.includes('drop off') ||
    lower.includes('return')
  )
    return 'errand';
  if (
    lower.includes('gym') ||
    lower.includes('workout') ||
    lower.includes('exercise') ||
    lower.includes('run') ||
    lower.includes('walk') ||
    lower.includes('stretch') ||
    lower.includes('meditat')
  )
    return 'health';
  if (
    lower.includes('decide') ||
    lower.includes('decision') ||
    lower.includes('choose') ||
    lower.includes('figure out') ||
    lower.includes('should i')
  )
    return 'decision';
  if (lower.includes('work') || lower.includes('project') || lower.includes('report')) return 'work';
  return 'default';
}

// Near-zero-effort openers. Step one should never require real thinking.
const ZERO_EFFORT_STARTERS = [
  'Take one breath and unclench your jaw. That is the whole first step — nothing else.',
  'Put your phone face-down and out of arm’s reach. Done? Good, that counts.',
  'Sit down where you can do this and take a sip of water. You’ve officially started.',
  'Stand up, stretch for ten seconds, then sit back down. That’s a real step.',
];

export function buildEasierStep1(): string {
  return ZERO_EFFORT_STARTERS[Math.floor(Math.random() * ZERO_EFFORT_STARTERS.length)];
}

function zeroEffortStarter(): string {
  return ZERO_EFFORT_STARTERS[Math.floor(Math.random() * ZERO_EFFORT_STARTERS.length)];
}

// The tiniest first slice of real progress for a big, multi-week goal. These use
// only common-knowledge tools and never assume a specific named resource exists.
const BIG_PROJECT_SLICE: Record<UnstuckCategory, string> = {
  coding:
    'Open your editor or LeetCode and just read one Easy problem — you do not have to solve it. Reading it is the win.',
  studying:
    'Open one resource you already have and read a single page, or watch the first five minutes. Just one.',
  writing:
    'Open a blank doc and write one ugly sentence about any part of it. It can be terrible — that’s allowed.',
  work:
    'Open the one tool you’d use and do the smallest visible thing: name the file, or write a single line.',
  email:
    'Open your inbox and find just one message related to this. Don’t reply yet — only open it.',
  paperwork:
    'Pull together anything related into a single pile or folder. Don’t sort it, just gather it.',
  phone_call:
    'Write the one sentence you’d open the call with on a sticky note. That’s the whole task right now.',
  cleaning:
    'Pick up exactly three items near you and put each where it belongs. Stop after three.',
  errand:
    'Write the single most important item on a note and put it by your keys. That’s enough.',
  health:
    'Put on the clothes or shoes you’d move in. Even just the shoes counts as starting.',
  decision:
    'Write the decision in one line, then jot two options as bullet points. No essays.',
  default:
    'Pick the smallest possible first action you can say out loud, and do only that one thing.',
};

export function buildSteps(task: string, category: UnstuckCategory, clarifyValue?: string): string[] {
  // For massive goals, don't try to plan it all — get them moving in ~15 minutes.
  if (isBigProject(task)) {
    return [
      zeroEffortStarter(),
      'Set a 15-minute timer. We are NOT doing the whole thing today — only starting one tiny piece.',
      `${BIG_PROJECT_SLICE[category]} When the timer rings, you have full permission to stop.`,
    ];
  }

  const templates: Record<UnstuckCategory, [string, string, string]> = {
    email: [
      'Put your phone face-down and close every tab except your inbox. That’s the whole first step.',
      clarifyValue === 'sending'
        ? 'Find the message you’ve been avoiding and just open it — don’t reply yet, only open it.'
        : 'Open a blank reply and type one rough sentence. It’s allowed to be bad. Then stop.',
      'Read your sentence out loud. Says what you need? Hit send. If not, tweak just that one sentence.',
    ],
    cleaning: [
      clarifyValue === 'finishing'
        ? 'Walk to the spot that’s almost done and stand there for ten seconds. Don’t touch anything yet.'
        : 'Stand up and walk to the messiest spot. Don’t touch anything yet — just look at it.',
      'Pick up exactly three items and put each where it belongs. Just three.',
      'Look at that spot — even slightly better? That is genuinely enough for now.',
    ],
    coding: [
      'Open your code editor. Just the editor — a blank window is completely fine.',
      'Set a 15-minute timer and write a single TODO comment for the very next small thing.',
      'Do only what that one TODO says. When the timer rings, you can stop guilt-free.',
    ],
    studying: [
      'Put your phone in another room or face-down across the desk. That’s step one.',
      'Set a 15-minute timer. We’re not studying it all — just starting.',
      'Open your notes or material to wherever you left off and read one paragraph. Just one. Stop when it rings.',
    ],
    writing: [
      'Open a blank doc and type the ugliest possible first sentence. It’ll get deleted later anyway.',
      'Set a 15-minute timer. The goal is words on the page, not good words.',
      'Keep going until the timer rings, then stop. You broke the blank-page freeze — that was the hard part.',
    ],
    work: [
      'Close every app and tab except the one thing you need. One screen, one task.',
      'Open whatever you actually work in for this (doc, editor, spreadsheet). Blank or last-saved is fine.',
      'Set a 15-minute timer and do the smallest next piece. Stop when it rings.',
    ],
    paperwork: [
      'Clear your desk — push everything to one side so you have a blank workspace.',
      'Gather everything related into one pile. Don’t sort it, just stack it.',
      'Find the single item with the nearest deadline and put it on top. Locate it — you don’t have to fill it yet.',
    ],
    phone_call: [
      'Write the phone number on a sticky note and stick it where you can see it.',
      'Write one sentence you need to say. Just the opening line.',
      'Check: do you have any reference number or info ready? That’s all you need to dial.',
    ],
    errand: [
      'Put your keys, wallet, and shoes by the door. Don’t leave yet — just gather them.',
      'Write the one thing you need to get or do on a sticky note.',
      'Set a 10-minute timer. When it rings, head out — future-you will be relieved it’s done.',
    ],
    health: [
      'Put on whatever you move in — even just your shoes. That’s the entire first step.',
      'Set a 10-minute timer. Ten minutes only, then you’re allowed to stop.',
      'Do the easiest version: a short walk, a few stretches. Showing up beats intensity.',
    ],
    decision: [
      'Write the decision at the top of a note in one short line.',
      'Set a 10-minute timer and jot two options as bullet points — not essays.',
      'Pick the one that feels 1% lighter. You can change your mind later; momentum matters more than perfect.',
    ],
    default: [
      'Take one breath, unclench your jaw, and put your phone out of reach. That’s step one.',
      'Set a 15-minute timer. We’re not finishing this — only starting.',
      'Do the tiniest first slice you can name out loud. When the timer rings, you have permission to stop.',
    ],
  };

  return templates[category];
}
