// Continuous mushaf paragraph. SPEC §11.1 (revised 2026-07-07).
// One <Text> per Madani page; ayat are nested <Text> spans with tap dispatch.
// No long-press — mode toolbar handles all actions now.

import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useHifzStore } from '@stores/hifz';
import { useNotesStore } from '@stores/notes';
import { useSessionStore } from '@stores/session';
import { light } from '@theme/colors';
import type { AyahState } from '@core/hifz';

interface Ayah {
  ayah: number;
  text: string;
}

interface Props {
  surah: number;
  page: number;
  ayat: Ayah[];
  fontSize?: number;
  onTap: (surah: number, ayah: number) => void;
}

const ARABIC_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

function toArabicIndic(n: number): string {
  return String(n)
    .split('')
    .map((d) => (d.match(/\d/) ? ARABIC_INDIC[Number(d)] : d))
    .join('');
}

function backgroundFor(state: AyahState, playing: boolean): string | undefined {
  if (playing) return light.state.playingBg;
  if (state === 'learning') return light.state.learningBg;
  if (state === 'memorized' || state === 'needsReview') return light.state.memorizedBg;
  return undefined;
}

function markerColorFor(state: AyahState, playing: boolean): string {
  if (playing) return light.state.playingMarker;
  if (state === 'memorized') return light.accent;
  if (state === 'needsReview') return light.state.needsReview;
  if (state === 'learning') return light.state.learningMarker;
  // Mushaf tradition: ayah markers illuminated in gold.
  return light.accentSecondary;
}

const NO_SELECT = {
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
} as unknown as Record<string, string>;

export const ContinuousPage = memo(function ContinuousPage({
  surah,
  page,
  ayat,
  fontSize = 28,
  onTap,
}: Props) {
  const records = useHifzStore((s) => s.records);
  const allNotes = useNotesStore((s) => s.notes);
  const playingAyah = useSessionStore((s) => s.playingAyah);

  const stateBySeq = useMemo(() => {
    const map = new Map<number, AyahState>();
    for (const a of ayat) {
      const r = records.find((rr) => rr.surah === surah && rr.ayah === a.ayah);
      map.set(a.ayah, r?.state ?? 'none');
    }
    return map;
  }, [records, surah, ayat]);

  const noteSet = useMemo(() => {
    const set = new Set<number>();
    for (const n of allNotes) {
      if (n.scope === 'ayah' && n.surah === surah && typeof n.ayah === 'number') {
        set.add(n.ayah);
      }
    }
    return set;
  }, [allNotes, surah]);

  return (
    <View style={styles.page}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageLabel}>page {toArabicIndic(page)}</Text>
      </View>
      <Text
        selectable={false}
        style={[styles.arabic, NO_SELECT, { fontSize, lineHeight: Math.round(fontSize * 1.95) }] as any}
      >
        {ayat.map((a) => {
          const state = stateBySeq.get(a.ayah) ?? 'none';
          const playing = playingAyah?.surah === surah && playingAyah?.ayah === a.ayah;
          const bg = backgroundFor(state, playing);
          const markerColor = markerColorFor(state, playing);
          return (
            <Text key={a.ayah}>
              <Text
                onPress={() => onTap(surah, a.ayah)}
                selectable={false}
                style={[NO_SELECT, bg ? { backgroundColor: bg } : null] as any}
              >
                {a.text}
              </Text>
              <Text
                onPress={() => onTap(surah, a.ayah)}
                selectable={false}
                style={[styles.marker, NO_SELECT, { color: markerColor }] as any}
              >
                {' '}
                {noteSet.has(a.ayah) ? (
                  <Text style={styles.noteGlyph}>✎ </Text>
                ) : null}
                ۝{toArabicIndic(a.ayah)}
                {' '}
              </Text>
            </Text>
          );
        })}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  page: {
    marginBottom: 16,
  },
  pageHeader: {
    alignItems: 'center',
    marginBottom: 8,
    opacity: 0.5,
  },
  pageLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'lowercase',
    letterSpacing: 0.5,
  },
  arabic: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    textAlign: 'justify',
    writingDirection: 'rtl',
    color: light.text,
  },
  marker: {
    fontSize: 22,
    fontFamily: 'NotoNaskhArabic_400Regular',
  },
  noteGlyph: {
    fontSize: 16,
    color: light.accentSecondary,
  },
});
