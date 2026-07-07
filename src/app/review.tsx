// Review session player. SPEC §14.4.
// Presents due chunks one at a time. Two big buttons: Récité ✓ / Difficile.
// Session end: celebration + back to Today.

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Loader, X } from 'lucide-react-native';
import ayahIndexJson from '@content/ayah-index.json';
import structure from '@content/structure.json';
import type { AyahIndex, SurahMeta } from '@content/types';
import { dueChunks } from '@core/hifz';
import type { DueChunk } from '@core/hifz';
import { useHifzStore } from '@stores/hifz';
import { useSettingsStore } from '@stores/settings';
import { light } from '@theme/colors';

const IDX = ayahIndexJson as AyahIndex;
const META = structure as SurahMeta[];

export default function ReviewScreen() {
  const router = useRouter();
  const records = useHifzStore((s) => s.records);
  const markReviewed = useHifzStore((s) => s.markReviewed);
  const dailyBudget = useSettingsStore((s) => s.dailyBudget);

  // Snapshot the queue when the screen opens so marking one chunk doesn't
  // reshuffle the list. The user progresses through the initial N chunks.
  const initialQueue = useMemo<DueChunk[]>(
    () => dueChunks(records, IDX, { dailyBudget, now: new Date().toISOString() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [cursor, setCursor] = useState(0);

  if (initialQueue.length === 0) {
    return (
      <View style={styles.host}>
        <View style={styles.empty}>
          <Text style={styles.emptyGlyph}>·</Text>
          <Text style={styles.emptyTitle}>Rien à réviser aujourd'hui</Text>
          <Text style={styles.emptySub}>Reviens un peu plus tard.</Text>
          <Pressable onPress={() => router.replace('/')} style={styles.homeBtn}>
            <Text style={styles.homeBtnLabel}>Retour</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (cursor >= initialQueue.length) {
    return (
      <View style={styles.host}>
        <View style={styles.empty}>
          <Text style={styles.doneGlyph}>✓</Text>
          <Text style={styles.emptyTitle}>Bien joué</Text>
          <Text style={styles.emptySub}>
            {initialQueue.length} révision{initialQueue.length > 1 ? 's' : ''} terminée
            {initialQueue.length > 1 ? 's' : ''}.
          </Text>
          <Pressable onPress={() => router.replace('/')} style={styles.homeBtn}>
            <Text style={styles.homeBtnLabel}>Retour</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const chunk = initialQueue[cursor]!;
  const surahMeta = META.find((m) => m.id === chunk.surah);
  const label = `${surahMeta?.nameTransliterated ?? ''} · ${chunk.startAyah}${
    chunk.endAyah !== chunk.startAyah ? `–${chunk.endAyah}` : ''
  }`;
  const size = chunk.endAyah - chunk.startAyah + 1;

  const advance = (outcome: 'ok' | 'hard') => {
    markReviewed(chunk, outcome);
    setCursor((c) => c + 1);
  };

  return (
    <View style={styles.host}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <X size={22} color={light.textMuted} />
        </Pressable>
        <Text style={styles.progress}>
          {cursor + 1} / {initialQueue.length}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        <Loader size={20} color={light.accentSecondary} />
        <Text style={styles.chunkLabel}>Réviser</Text>
        <Text style={styles.chunkTitle}>{label}</Text>
        <Text style={styles.chunkSub}>
          {size} verset{size > 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.buttons}>
        <Pressable style={styles.btnHard} onPress={() => advance('hard')}>
          <Text style={styles.btnHardLabel}>Difficile</Text>
        </Pressable>
        <Pressable style={styles.btnOk} onPress={() => advance('ok')}>
          <Check size={18} color="#FFFFFF" />
          <Text style={styles.btnOkLabel}>Récité</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    backgroundColor: light.bg,
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progress: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chunkLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
  },
  chunkTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: light.text,
    textAlign: 'center',
  },
  chunkSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: light.textMuted,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  btnHard: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: light.border,
    alignItems: 'center',
    backgroundColor: light.surface,
  },
  btnHardLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: light.text,
  },
  btnOk: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: light.accent,
  },
  btnOkLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyGlyph: {
    fontFamily: 'Inter_400Regular',
    fontSize: 48,
    color: light.textMuted,
  },
  doneGlyph: {
    fontFamily: 'Inter_700Bold',
    fontSize: 48,
    color: light.accent,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: light.text,
    marginTop: 8,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: light.textMuted,
    textAlign: 'center',
  },
  homeBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: light.accent,
  },
  homeBtnLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
