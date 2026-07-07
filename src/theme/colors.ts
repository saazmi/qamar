// Semantic color tokens. SPEC §16.2. No raw hex in components — reference tokens only.

export const light = {
  bg: '#F5EAC7', // light parchment gold — mushaf feel (from the secondary accent family)
  surface: '#FFFDF6', // near-white with a warm cast so cards still pop against the gold bg
  surfaceMuted: '#EFDDA8', // subtly darker parchment for card interiors
  border: '#D9C48A', // soft gold border — visible on both bg and surface
  borderMuted: '#E7D6A4', // gentler divider for row separators
  grabber: '#C9B57A', // sheet grabber pill

  text: '#1F1B16',
  textMuted: '#6D5F3E', // warm gold-brown so muted text harmonizes with the bg
  accent: '#2D6A4F', // memorized / primary
  accentSecondary: '#B7891A', // deeper gold — meets AA contrast against parchment
  state: {
    learningBg: '#F3D488', // shifted amber — visible against parchment
    learningMarker: '#8B6914', // deep amber for the ayah number
    memorizedBg: '#C1D5A8', // soft sage-olive — warmer than mint, pairs with gold
    memorizedLine: '#2D6A4F',
    needsReview: '#8FB39D',
    playingBg: '#E8CAC0', // dusty peach — analogous to the parchment + vermillion marker
    playingMarker: '#B0432E', // mushaf vermillion
  },
  error: '#B03A48',
  // v1.1 — SPEC §8.3
  tajweed: {},
};

export const dark = {
  bg: '#1A1714',
  surface: '#241F1B',
  surfaceMuted: '#2C2621',
  border: '#3A322A',
  borderMuted: '#2E2822',
  grabber: '#4A4136',
  text: '#F4EEE4',
  textMuted: '#9F978A',
  accent: '#5FA383',
  accentSecondary: '#D9B84A',
  state: {
    learningBg: '#4A3A1F',
    learningMarker: '#D9B84A',
    memorizedBg: '#2E3A25',
    memorizedLine: '#5FA383',
    needsReview: '#4E7A63',
    playingBg: '#3E2C26',
    playingMarker: '#D96D57',
  },
  error: '#D77687',
  tajweed: {},
};

export type ColorTokens = typeof light;
