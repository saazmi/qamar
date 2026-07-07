// Semantic color tokens. SPEC §16.2. No raw hex in components — reference tokens only.

export const light = {
  bg: '#FAF7F2',
  surface: '#FFFFFF',
  text: '#1F1B16',
  textMuted: '#6B6357',
  accent: '#2D6A4F', // memorized / primary
  accentSecondary: '#C9A227', // gold, milestones/juz rings
  state: {
    learningBg: '#F7E5C1',
    memorizedBg: '#DCEBE1',
    memorizedLine: '#2D6A4F',
    needsReview: '#8FB39D',
  },
  error: '#B03A48',
  // v1.1 — SPEC §8.3
  tajweed: {},
};

export const dark = {
  bg: '#1A1714',
  surface: '#241F1B',
  text: '#F4EEE4',
  textMuted: '#9F978A',
  accent: '#5FA383',
  accentSecondary: '#D9B84A',
  state: {
    learningBg: '#4A3A1F',
    memorizedBg: '#22362C',
    memorizedLine: '#5FA383',
    needsReview: '#4E7A63',
  },
  error: '#D77687',
  tajweed: {},
};

export type ColorTokens = typeof light;
