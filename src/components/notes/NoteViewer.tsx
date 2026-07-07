// Full-screen note viewer. Same visual language as NoteEditorSheet, but
// read-only. The canvas fills the container width, honoring the note's
// saved aspect ratio.

import { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CanvasView } from '@components/notes/Canvas';
import structure from '@content/structure.json';
import type { SurahMeta } from '@content/types';
import { useNotesStore } from '@stores/notes';
import { useSessionStore } from '@stores/session';
import { light } from '@theme/colors';

const META = structure as SurahMeta[];

export function NoteViewer() {
  const id = useSessionStore((s) => s.viewingNoteId);
  const close = useSessionStore((s) => s.closeNoteViewer);
  const allNotes = useNotesStore((s) => s.notes);

  const note = useMemo(() => allNotes.find((n) => n.id === id), [allNotes, id]);
  if (!note) return null;

  const surahMeta = META.find((m) => m.id === note.surah);
  const ref =
    note.scope === 'ayah'
      ? `${surahMeta?.nameTransliterated ?? ''} · ${note.surah}:${note.ayah}`
      : `${surahMeta?.nameTransliterated ?? ''} · sourate`;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.grabber} />

            <View style={styles.headerRow}>
              <Text style={styles.ref}>{ref}</Text>
              <Pressable onPress={close} hitSlop={12}>
                <Text style={styles.close}>×</Text>
              </Pressable>
            </View>

            <View style={styles.kindPillRow}>
              <Text style={styles.kindPill}>
                {note.kind === 'canvas' ? '✎ Dessin' : 'T Texte'} · lecture seule
              </Text>
            </View>

            {note.kind === 'canvas' ? (
              <View style={styles.canvasFrame}>
                <CanvasView body={note.body} />
              </View>
            ) : (
              <Text style={styles.text}>{note.body}</Text>
            )}

            <Pressable onPress={close} style={styles.closeBtn}>
              <Text style={styles.closeLabel}>Fermer</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingTop: 32,
  },
  sheet: {
    flex: 1,
    backgroundColor: light.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  body: {
    padding: 20,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DED7CB',
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
  kindPillRow: {
    marginBottom: 12,
  },
  kindPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F5EFE4',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    overflow: 'hidden',
  },
  canvasFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE7DD',
    padding: 8,
    width: '100%',
  },
  text: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: light.text,
  },
  closeBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: light.accent,
    alignItems: 'center',
  },
  closeLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
