// Verse bottom sheet. SPEC §11.4.
// - surah:ayah reference + Arabic text
// - three-button state segmented control (Non commencé / En cours / Mémorisé)
// - translation (always shown in the sheet, per §11.4)
// - "Marquer jusqu'ici…" range shortcut back to the start of the current run

import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { CanvasView } from '@components/notes/Canvas';
import { useAyahAudio } from '../../hooks/useAyahAudio';
import { useHifzStore } from '@stores/hifz';
import { useNotesStore } from '@stores/notes';
import { useSessionStore } from '@stores/session';
import { useUiStore } from '@stores/ui';
import structure from '@content/structure.json';
import { loadSurah } from '@content/text';
import { loadSurah as loadFrench } from '@content/translation-fr';
import type { AyahText, SurahMeta } from '@content/types';
import type { AyahState } from '@core/hifz';
import { light } from '@theme/colors';

const META = structure as SurahMeta[];

const STATES: Array<{ key: 'none' | 'learning' | 'memorized'; label: string }> = [
  { key: 'none', label: 'Non commencé' },
  { key: 'learning', label: 'En cours' },
  { key: 'memorized', label: 'Mémorisé' },
];

function stateOf(records: ReturnType<typeof useHifzStore.getState>['records'], surah: number, ayah: number): AyahState {
  const r = records.find((rr) => rr.surah === surah && rr.ayah === ayah);
  return r?.state ?? 'none';
}

function findRunStart(records: ReturnType<typeof useHifzStore.getState>['records'], surah: number, ayah: number): number {
  const s = stateOf(records, surah, ayah);
  if (s === 'none') return ayah;
  let start = ayah;
  while (start > 1 && stateOf(records, surah, start - 1) === s) start -= 1;
  return start;
}

export function VerseSheet() {
  const openVerse = useSessionStore((s) => s.openVerse);
  const close = useSessionStore((s) => s.closeVerseSheet);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const { play, stop, loading, isPlaying } = useAyahAudio();
  const records = useHifzStore((s) => s.records);
  const setState = useHifzStore((s) => s.setState);
  const applyRange = useHifzStore((s) => s.applyRange);
  const undo = useHifzStore((s) => s.undo);
  const showToast = useUiStore((s) => s.showToast);
  const allNotes = useNotesStore((s) => s.notes);

  const verseNotes = useMemo(() => {
    if (!openVerse) return [];
    return allNotes.filter(
      (n) => n.scope === 'ayah' && n.surah === openVerse.surah && n.ayah === openVerse.ayah,
    );
  }, [allNotes, openVerse]);

  const surahNotes = useMemo(() => {
    if (!openVerse) return [];
    return allNotes.filter((n) => n.scope === 'surah' && n.surah === openVerse.surah);
  }, [allNotes, openVerse]);

  const meta = openVerse ? META.find((m) => m.id === openVerse.surah) : undefined;

  const arabicText = useMemo(() => {
    if (!openVerse) return '';
    const list = loadSurah(openVerse.surah) ?? [];
    return list.find((a: AyahText) => a.ayah === openVerse.ayah)?.text ?? '';
  }, [openVerse]);

  const frenchText = useMemo(() => {
    if (!openVerse) return '';
    const list = loadFrench(openVerse.surah) ?? [];
    return list.find((a: AyahText) => a.ayah === openVerse.ayah)?.text ?? '';
  }, [openVerse]);

  const currentState = openVerse ? stateOf(records, openVerse.surah, openVerse.ayah) : 'none';

  // Reset store openVerse when component unmounts, defensive.
  useEffect(() => () => close(), [close]);

  if (!openVerse || !meta) return null;

  const runStart = findRunStart(records, openVerse.surah, openVerse.ayah);
  const canMarkRange = runStart !== openVerse.ayah;

  const applyState = (next: 'none' | 'learning' | 'memorized') => {
    setState(openVerse.surah, openVerse.ayah, next);
    const label = { none: 'Effacé', learning: 'En cours', memorized: 'Mémorisé' }[next];
    showToast({
      message: `${label} · ${openVerse.surah}:${openVerse.ayah}`,
      actionLabel: 'Annuler',
      onAction: () => undo(),
    });
  };

  const markRange = () => {
    const s = stateOf(records, openVerse.surah, openVerse.ayah);
    const target: 'none' | 'learning' | 'memorized' =
      s === 'needsReview' ? 'memorized' : (s as 'none' | 'learning' | 'memorized');
    applyRange(openVerse.surah, runStart, openVerse.ayah, target);
    showToast({
      message: `${runStart}–${openVerse.ayah} marqués`,
      actionLabel: 'Annuler',
      onAction: () => undo(),
    });
    close();
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
    >
      <Pressable style={styles.scrim} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation?.()}>
          <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            <View style={styles.grabber} />

            <View style={styles.headerRow}>
              <Text style={styles.ref}>
                {meta.nameTransliterated} · {openVerse.surah}:{openVerse.ayah}
              </Text>
              <Pressable onPress={close} hitSlop={12}>
                <Text style={styles.close}>×</Text>
              </Pressable>
            </View>

            <Text
              style={[
                styles.arabic,
                openVerse && isPlaying(openVerse.surah, openVerse.ayah) && styles.arabicPlaying,
              ]}
              selectable
            >
              {arabicText}
            </Text>

            <View style={styles.stateRow}>
              {STATES.map((s) => {
                const active = currentState === s.key || (currentState === 'needsReview' && s.key === 'memorized');
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => applyState(s.key)}
                    style={[styles.stateBtn, active && styles.stateBtnActive]}
                  >
                    <Text style={[styles.stateLabel, active && styles.stateLabelActive]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {canMarkRange && (
              <Pressable style={styles.rangeBtn} onPress={markRange}>
                <Text style={styles.rangeLabel}>
                  Marquer jusqu'ici · {runStart}–{openVerse.ayah}
                </Text>
              </Pressable>
            )}

            <Pressable
              style={styles.audioBtn}
              onPress={() => {
                if (!openVerse) return;
                if (isPlaying(openVerse.surah, openVerse.ayah)) {
                  void stop();
                } else {
                  void play(openVerse.surah, openVerse.ayah);
                }
              }}
              disabled={loading}
            >
              <Text style={styles.audioGlyph}>
                {isPlaying(openVerse.surah, openVerse.ayah) ? '■' : '▶'}
              </Text>
              <Text style={styles.audioLabel}>
                {loading
                  ? 'Chargement…'
                  : isPlaying(openVerse.surah, openVerse.ayah)
                  ? 'Arrêter'
                  : 'Écouter'}
              </Text>
            </Pressable>

            {frenchText ? (
              <View style={styles.translationCard}>
                <Text style={styles.translationLabel}>Traduction · Hamidullah</Text>
                <Text style={styles.translation}>{frenchText}</Text>
              </View>
            ) : null}

            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              {verseNotes.length === 0 && surahNotes.length === 0 ? (
                <Text style={styles.notesEmpty}>Aucune note</Text>
              ) : (
                <>
                  {[...verseNotes, ...surahNotes].map((n) => {
                    const scopeLabel = n.scope === 'ayah' ? 'Verset' : 'Sourate';
                    const expanded = viewingId === n.id;
                    return (
                      <View key={n.id} style={styles.noteCard}>
                        <View style={styles.noteHeaderRow}>
                          <Text style={styles.noteScope}>
                            {scopeLabel} · {n.kind === 'canvas' ? 'dessin' : 'texte'}
                          </Text>
                          <Pressable
                            onPress={() => setViewingId(expanded ? null : n.id)}
                            hitSlop={8}
                          >
                            {expanded ? (
                              <EyeOff size={16} color={light.textMuted} />
                            ) : (
                              <Eye size={16} color={light.textMuted} />
                            )}
                          </Pressable>
                        </View>
                        {n.kind === 'canvas' ? (
                          expanded ? (
                            <View style={styles.canvasFullWrap}>
                              <CanvasView body={n.body} />
                            </View>
                          ) : (
                            <View style={styles.canvasThumb}>
                              <CanvasView body={n.body} width={90} />
                            </View>
                          )
                        ) : (
                          <Text
                            style={styles.noteBody}
                            numberOfLines={expanded ? undefined : 2}
                          >
                            {n.body}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </>
              )}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: light.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: light.grabber,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ref: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  close: {
    fontFamily: 'Inter_400Regular',
    fontSize: 26,
    color: light.textMuted,
    marginTop: -4,
  },
  arabic: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 26,
    lineHeight: 48,
    color: light.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  arabicPlaying: {
    backgroundColor: light.state.playingBg,
    color: light.state.playingMarker,
  },
  stateRow: {
    flexDirection: 'row',
    borderRadius: 10,
    backgroundColor: light.surfaceMuted,
    padding: 4,
    gap: 4,
  },
  stateBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  stateBtnActive: {
    backgroundColor: light.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  stateLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: light.textMuted,
  },
  stateLabelActive: {
    color: light.accent,
  },
  rangeBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: light.accent,
    alignItems: 'center',
  },
  rangeLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: light.accent,
  },
  audioBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: light.surfaceMuted,
  },
  audioGlyph: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: light.accent,
  },
  audioLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: light.text,
  },
  translationCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 10,
    backgroundColor: light.surfaceMuted,
  },
  translationLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  translation: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: light.text,
  },
  notesSection: {
    marginTop: 20,
    gap: 8,
  },
  notesLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesEmpty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: light.textMuted,
    fontStyle: 'italic',
  },
  noteCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: light.surfaceMuted,
    borderLeftWidth: 3,
    borderLeftColor: light.accentSecondary,
  },
  noteScope: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  noteBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: light.text,
  },
  canvasThumb: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  canvasFullWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
