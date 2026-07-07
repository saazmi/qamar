// Reading view. SPEC §11 — killer feature (this file: Phase 1 smoke test only).
// FlashList of AyahBlock components; per-verse state; tap=safe, long-press=cycle.

import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import structure from '@content/structure.json';
import { loadSurah } from '@content/text';
import { loadSurah as loadFrench } from '@content/translation-fr';
import type { SurahMeta } from '@content/types';

const meta = structure as SurahMeta[];

export default function ReadingViewScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const id = Number(surahId) || 1;
  const surahMeta = meta.find((m) => m.id === id);
  const ayat = loadSurah(id) ?? [];
  const french = loadFrench(id) ?? [];

  if (!surahMeta) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Sourate introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontFamily: 'NotoNaskhArabic_700Bold', fontSize: 32 }}>
          {surahMeta.nameArabic}
        </Text>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, marginTop: 4 }}>
          {surahMeta.nameFrench} · {surahMeta.ayahCount} versets
        </Text>
      </View>

      {ayat.map((a) => (
        <View
          key={a.ayah}
          style={{
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#EEE7DD',
          }}
        >
          <Text
            style={{
              fontFamily: 'NotoNaskhArabic_400Regular',
              fontSize: 28,
              lineHeight: 52,
              textAlign: 'right',
              writingDirection: 'rtl',
            }}
          >
            {a.text} ﴿{a.ayah}﴾
          </Text>
          {french[a.ayah - 1] && (
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                lineHeight: 20,
                color: '#6B6357',
                marginTop: 8,
              }}
            >
              {french[a.ayah - 1]!.text}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
