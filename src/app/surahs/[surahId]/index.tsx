// Reading view. SPEC §11 — killer feature.
// FlashList of AyahBlock; per-verse state; tap=safe, long-press=cycle.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { AyahBlock } from '@components/quran/AyahBlock';
import structure from '@content/structure.json';
import { loadSurah } from '@content/text';
import { loadSurah as loadFrench } from '@content/translation-fr';
import type { AyahText, SurahMeta } from '@content/types';
import { light } from '@theme/colors';

const meta = structure as SurahMeta[];

interface Row {
  ayah: number;
  text: string;
  french?: string;
}

export default function ReadingViewScreen() {
  const router = useRouter();
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const id = Number(surahId) || 1;
  const surahMeta = meta.find((m) => m.id === id);

  const [showFrench, setShowFrench] = useState(false);

  const rows: Row[] = useMemo(() => {
    const ar = loadSurah(id) ?? [];
    const fr = loadFrench(id) ?? [];
    const frByAyah = new Map<number, string>(fr.map((a: AyahText) => [a.ayah, a.text]));
    return ar.map((a: AyahText) => ({ ayah: a.ayah, text: a.text, french: frByAyah.get(a.ayah) }));
  }, [id]);

  if (!surahMeta) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Sourate introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.host}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.arabicName}>{surahMeta.nameArabic}</Text>
          <Text style={styles.frenchName}>
            {surahMeta.nameFrench} · {surahMeta.ayahCount} versets
          </Text>
        </View>
        <Pressable onPress={() => setShowFrench((v) => !v)} hitSlop={12}>
          <Text style={[styles.toggle, showFrench && styles.toggleOn]}>FR</Text>
        </Pressable>
      </View>

      <FlashList
        data={rows}
        keyExtractor={(item) => String(item.ayah)}
        contentContainerStyle={{ padding: 12, paddingBottom: 96 }}
        renderItem={({ item }) => (
          <AyahBlock
            surah={id}
            ayah={item.ayah}
            text={item.text}
            frenchText={item.french}
            showFrench={showFrench}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    backgroundColor: light.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE7DD',
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
  },
  back: {
    fontSize: 28,
    fontFamily: 'Inter_600SemiBold',
    color: light.text,
    width: 24,
  },
  arabicName: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 24,
    color: light.text,
  },
  frenchName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: light.textMuted,
    marginTop: 2,
  },
  toggle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: light.textMuted,
    borderWidth: 1,
    borderColor: light.textMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  toggleOn: {
    color: light.accent,
    borderColor: light.accent,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: light.textMuted,
  },
});
