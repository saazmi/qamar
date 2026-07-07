// Continuous mushaf paragraph. SPEC §11.1 (revised 2026-07-07).
// One <Text> per Madani page; ayat are nested <Text> spans with their own
// press handlers. Background wash + colored ayah marker convey state.
//
// RN Web note: nested Text `onLongPress` is unreliable, so we implement
// long-press via onPressIn / onPressOut / onPress timing per-span.

import { memo, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useHifzStore } from '@stores/hifz';
import { useUiStore } from '@stores/ui';
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
  onOpenSheet?: (surah: number, ayah: number) => void;
}

const CYCLE: Record<'none' | 'learning' | 'memorized', 'learning' | 'memorized' | 'none'> = {
  none: 'learning',
  learning: 'memorized',
  memorized: 'none',
};

const LONG_PRESS_MS = 380;

const ARABIC_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

function toArabicIndic(n: number): string {
  return String(n)
    .split('')
    .map((d) => (d.match(/\d/) ? ARABIC_INDIC[Number(d)] : d))
    .join('');
}

function backgroundFor(state: AyahState): string | undefined {
  if (state === 'learning') return light.state.learningBg;
  if (state === 'memorized' || state === 'needsReview') return light.state.memorizedBg;
  return undefined;
}

function markerColorFor(state: AyahState): string {
  if (state === 'memorized') return light.accent;
  if (state === 'needsReview') return light.state.needsReview;
  if (state === 'learning') return '#8B6914';
  return light.textMuted;
}

interface SpanProps {
  surah: number;
  ayah: number;
  text: string;
  state: AyahState;
  onTap: (ayah: number) => void;
  onCycle: (ayah: number) => void;
}

const AyahSpan = memo(function AyahSpan({
  surah: _surah,
  ayah,
  text,
  state,
  onTap,
  onCycle,
}: SpanProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFiredRef = useRef(false);

  const cancelTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPressIn = useCallback(() => {
    longFiredRef.current = false;
    cancelTimer();
    timerRef.current = setTimeout(() => {
      longFiredRef.current = true;
      onCycle(ayah);
      timerRef.current = null;
    }, LONG_PRESS_MS);
  }, [ayah, onCycle, cancelTimer]);

  const onPressOut = useCallback(() => {
    cancelTimer();
  }, [cancelTimer]);

  const onPress = useCallback(() => {
    if (longFiredRef.current) {
      longFiredRef.current = false;
      return;
    }
    onTap(ayah);
  }, [ayah, onTap]);

  const bg = backgroundFor(state);
  const markerColor = markerColorFor(state);

  return (
    <Text
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      selectable={false}
      style={[NO_SELECT, bg ? { backgroundColor: bg } : null] as any}
    >
      {text}
      <Text style={[styles.marker, { color: markerColor }]}>
        {' '}
        ۝{toArabicIndic(ayah)}{' '}
      </Text>
    </Text>
  );
});

export const ContinuousPage = memo(function ContinuousPage({
  surah,
  page,
  ayat,
  fontSize = 28,
  onOpenSheet,
}: Props) {
  const records = useHifzStore((s) => s.records);
  const setState = useHifzStore((s) => s.setState);
  const undo = useHifzStore((s) => s.undo);
  const showToast = useUiStore((s) => s.showToast);

  const stateBySeq = useMemo(() => {
    const map = new Map<number, AyahState>();
    for (const a of ayat) {
      const r = records.find((rr) => rr.surah === surah && rr.ayah === a.ayah);
      map.set(a.ayah, r?.state ?? 'none');
    }
    return map;
  }, [records, surah, ayat]);

  const onTap = useCallback(
    (ayah: number) => {
      onOpenSheet?.(surah, ayah);
    },
    [onOpenSheet, surah],
  );

  const onCycle = useCallback(
    (ayah: number) => {
      const s = stateBySeq.get(ayah) ?? 'none';
      const current = s === 'needsReview' ? 'memorized' : s;
      const next = CYCLE[current as 'none' | 'learning' | 'memorized'];
      setState(surah, ayah, next);
      const label = { none: 'Effacé', learning: 'En cours', memorized: 'Mémorisé' }[next];
      showToast({
        message: `${label} · ${surah}:${ayah}`,
        actionLabel: 'Annuler',
        onAction: () => undo(),
      });
    },
    [stateBySeq, setState, showToast, undo, surah],
  );

  return (
    <View style={styles.page}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageLabel}>page {toArabicIndic(page)}</Text>
      </View>
      <Text
        selectable={false}
        style={[
          styles.arabic,
          NO_SELECT,
          { fontSize, lineHeight: Math.round(fontSize * 1.95) },
        ] as any}
      >
        {ayat.map((a) => (
          <AyahSpan
            key={a.ayah}
            surah={surah}
            ayah={a.ayah}
            text={a.text}
            state={stateBySeq.get(a.ayah) ?? 'none'}
            onTap={onTap}
            onCycle={onCycle}
          />
        ))}
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
  span: {},
  marker: {
    fontSize: 22,
    fontFamily: 'NotoNaskhArabic_400Regular',
  },
});

// Web-only: prevent long-press → text-selection hijack.
// These CSS props aren't in RN's TextStyle typing, so applied as untyped.
const NO_SELECT = {
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
} as unknown as Record<string, string>;
