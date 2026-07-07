// Surah list. SPEC §10.3. FlashList of 114 rows, tri-color progress bars.

import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Search, X } from 'lucide-react-native';
import { SurahProgressBar } from '@components/tracking/SurahProgressBar';
import structure from '@content/structure.json';
import type { SurahMeta } from '@content/types';
import { useSurahProgress } from '../../hooks/useSurahProgress';
import { light } from '@theme/colors';

const META = structure as SurahMeta[];

const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // strip diacritics so 'A`raf' matches 'aaraf' etc.

export default function SurahListScreen() {
  const router = useRouter();
  const { perSurah, overall } = useSurahProgress();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return META;
    const nq = norm(q);
    return META.filter((s) => {
      if (String(s.id).startsWith(q)) return true;
      if (norm(s.nameTransliterated).includes(nq)) return true;
      if (s.nameArabic.includes(q)) return true;
      return false;
    });
  }, [query]);

  return (
    <View style={styles.host}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={styles.titles}>
          <Text style={styles.title}>Sourates</Text>
          <Text style={styles.subtitle}>
            {overall.memorized.toLocaleString('fr-FR')} / {overall.total.toLocaleString('fr-FR')} mémorisés
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchRow}>
        <Search size={16} color={light.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher une sourate…"
          placeholderTextColor={light.textMuted}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <X size={16} color={light.textMuted} />
          </Pressable>
        )}
      </View>

      <FlashList
        data={filtered}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 32 }}
        renderItem={({ item }) => {
          const counts = perSurah.get(item.id) ?? {
            memorized: 0,
            learning: 0,
            needsReview: 0,
            total: item.ayahCount,
          };
          return (
            <Link
              href={{ pathname: '/surahs/[surahId]', params: { surahId: String(item.id) } }}
              asChild
            >
              <Pressable style={styles.row}>
                <View style={styles.numberCircle}>
                  <Text style={styles.number}>{item.id}</Text>
                </View>
                <View style={styles.rowMain}>
                  <View style={styles.rowTopLine}>
                    <Text style={styles.french}>{item.nameTransliterated}</Text>
                    <Text style={styles.count}>{item.ayahCount}</Text>
                  </View>
                  <View style={styles.rowMidLine}>
                    <Text style={styles.arabic}>{item.nameArabic}</Text>
                    <Text style={styles.place}>{item.revelationPlace === 'makkah' ? 'Mecquoise' : 'Médinoise'}</Text>
                  </View>
                  <SurahProgressBar
                    memorized={counts.memorized}
                    learning={counts.learning}
                    needsReview={counts.needsReview}
                    total={counts.total}
                  />
                </View>
              </Pressable>
            </Link>
          );
        }}
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
    borderBottomColor: light.border,
  },
  back: {
    fontSize: 28,
    fontFamily: 'Inter_600SemiBold',
    color: light.text,
    width: 24,
  },
  titles: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: light.text,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: light.textMuted,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: light.border,
    backgroundColor: light.surface,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: light.text,
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: light.borderMuted,
  },
  numberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.surfaceMuted,
  },
  number: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: light.textMuted,
  },
  rowMain: {
    flex: 1,
    gap: 6,
  },
  rowTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowMidLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  french: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: light.text,
  },
  count: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: light.textMuted,
  },
  arabic: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 18,
    color: light.text,
  },
  place: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'lowercase',
  },
});
