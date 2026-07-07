// Today screen. SPEC §10.2 — the anti-overwhelm centerpiece.
// At most 3 cards: Continue learning · Review · Start something new.
// Below: today's delta + 7-day mini-heatmap. Nothing else.
// Phase 1 stub: link to Al-Fatiha for smoke-testing the content pipeline.

import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import structure from '@content/structure.json';
import type { SurahMeta } from '@content/types';

const meta = structure as SurahMeta[];

export default function TodayScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24 }}>Qamar</Text>
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#6B6357' }}>
        Phase 1 smoke test — content + font pipeline. Tap a surah below to open the reading
        view.
      </Text>

      {meta.slice(0, 5).map((s) => (
        <Link
          key={s.id}
          href={{ pathname: '/surahs/[surahId]', params: { surahId: String(s.id) } }}
          style={{
            padding: 16,
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#EEE7DD',
          }}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>
            {s.id}. {s.nameFrench}
          </Text>
          <Text
            style={{
              fontFamily: 'NotoNaskhArabic_400Regular',
              fontSize: 20,
              marginTop: 4,
              textAlign: 'right',
            }}
          >
            {s.nameArabic}
          </Text>
        </Link>
      ))}
    </ScrollView>
  );
}
