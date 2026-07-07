// Reading view. SPEC §11 — killer feature.
// Two modes: continuous mushaf (FR off, default) / fragmented + translation (FR on).
// Sticky mode toolbar drives all verse interactions via tap only.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { NotebookPen } from 'lucide-react-native';
import { AyahBlock } from '@components/quran/AyahBlock';
import { ContinuousPage } from '@components/quran/ContinuousPage';
import { NoteEditorSheet } from '@components/quran/NoteEditorSheet';
import { RangeStateSheet } from '@components/quran/RangeStateSheet';
import { ReadingToolbar } from '@components/quran/ReadingToolbar';
import { VerseSheet } from '@components/quran/VerseSheet';
import structure from '@content/structure.json';
import ayahIndexJson from '@content/ayah-index.json';
import { loadSurah } from '@content/text';
import { loadSurah as loadFrench } from '@content/translation-fr';
import type { AyahIndex, AyahText, SurahMeta } from '@content/types';
import { keyOf } from '@core/hifz';
import { useNotesStore } from '@stores/notes';
import { useSessionStore } from '@stores/session';
import { useAyahTapHandler } from '../../../hooks/useAyahTapHandler';
import { light } from '@theme/colors';

const meta = structure as SurahMeta[];
const IDX = ayahIndexJson as AyahIndex;

interface FragmentRow {
  ayah: number;
  text: string;
  french?: string;
}

interface PageRow {
  page: number;
  ayat: AyahText[];
}

export default function ReadingViewScreen() {
  const router = useRouter();
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const id = Number(surahId) || 1;
  const surahMeta = meta.find((m) => m.id === id);

  const [showFrench, setShowFrench] = useState(false);
  const openVerse = useSessionStore((s) => s.openVerse);
  const rangeSelection = useSessionStore((s) => s.rangeSelection);
  const noteEditor = useSessionStore((s) => s.noteEditor);
  const openNoteEditor = useSessionStore((s) => s.openNoteEditor);
  const surahNoteCount = useNotesStore((s) =>
    s.notes.reduce((n, note) => (note.scope === 'surah' && note.surah === id ? n + 1 : n), 0),
  );
  const onTap = useAyahTapHandler();

  const ayat = useMemo(() => loadSurah(id) ?? [], [id]);
  const french = useMemo(() => loadFrench(id) ?? [], [id]);

  const fragmentRows: FragmentRow[] = useMemo(() => {
    const frByAyah = new Map<number, string>(french.map((a: AyahText) => [a.ayah, a.text]));
    return ayat.map((a: AyahText) => ({
      ayah: a.ayah,
      text: a.text,
      french: frByAyah.get(a.ayah),
    }));
  }, [ayat, french]);

  const pageRows: PageRow[] = useMemo(() => {
    const byPage = new Map<number, AyahText[]>();
    for (const a of ayat) {
      const entry = IDX[keyOf(id, a.ayah)];
      const page = entry?.page ?? 0;
      const list = byPage.get(page) ?? [];
      list.push(a);
      byPage.set(page, list);
    }
    return [...byPage.entries()]
      .sort(([p1], [p2]) => p1 - p2)
      .map(([page, ayahList]) => ({ page, ayat: ayahList }));
  }, [ayat, id]);

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
            {surahMeta.nameTransliterated} · {surahMeta.ayahCount} versets
          </Text>
        </View>
        <Pressable
          onPress={() => openNoteEditor(id)}
          hitSlop={12}
          style={styles.notesBtn}
          accessibilityLabel="Notes de sourate"
        >
          <NotebookPen size={18} color={light.textMuted} />
          {surahNoteCount > 0 && (
            <View style={styles.notesBadge}>
              <Text style={styles.notesBadgeText}>{surahNoteCount}</Text>
            </View>
          )}
        </Pressable>
        <Pressable onPress={() => setShowFrench((v) => !v)} hitSlop={12}>
          <Text style={[styles.toggle, showFrench && styles.toggleOn]}>FR</Text>
        </Pressable>
      </View>

      <ReadingToolbar />

      {showFrench ? (
        <FlashList
          data={fragmentRows}
          keyExtractor={(item) => `f${item.ayah}`}
          contentContainerStyle={{ padding: 12, paddingBottom: 96 }}
          renderItem={({ item }) => (
            <AyahBlock
              surah={id}
              ayah={item.ayah}
              text={item.text}
              frenchText={item.french}
              showFrench
              onTap={onTap}
            />
          )}
        />
      ) : (
        <FlashList
          data={pageRows}
          keyExtractor={(item) => `p${item.page}`}
          contentContainerStyle={{ padding: 20, paddingBottom: 96 }}
          renderItem={({ item }) => (
            <ContinuousPage surah={id} page={item.page} ayat={item.ayat} onTap={onTap} />
          )}
        />
      )}
      {openVerse && <VerseSheet />}
      {rangeSelection && <RangeStateSheet />}
      {noteEditor && <NoteEditorSheet />}
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
  notesBtn: {
    position: 'relative',
    paddingHorizontal: 4,
  },
  notesBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: light.accentSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#FFFFFF',
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
