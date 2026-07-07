// Full-screen note viewer. Opens when the user taps "Voir" on any note.
// Renders canvas notes at the widest size the viewport permits, keeping
// the note's saved aspect ratio. Text notes render as a large, scrollable
// block.

import { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
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
  const { width: winW } = useWindowDimensions();

  const note = useMemo(() => allNotes.find((n) => n.id === id), [allNotes, id]);
  if (!note) return null;

  const surahMeta = META.find((m) => m.id === note.surah);
  const ref =
    note.scope === 'ayah'
      ? `${surahMeta?.nameTransliterated ?? ''} · ${note.surah}:${note.ayah}`
      : `${surahMeta?.nameTransliterated ?? ''} · sourate`;
  const targetWidth = Math.min(winW - 32, 900);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.host}>
        <View style={styles.header}>
          <Text style={styles.ref}>{ref}</Text>
          <Pressable onPress={close} hitSlop={12}>
            <Text style={styles.close}>×</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {note.kind === 'canvas' ? (
            <View style={styles.canvasFrame}>
              <CanvasView body={note.body} width={targetWidth} />
            </View>
          ) : (
            <Text style={styles.text}>{note.body}</Text>
          )}
        </ScrollView>
      </View>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE7DD',
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
    fontSize: 32,
    color: light.textMuted,
    lineHeight: 32,
  },
  body: {
    padding: 16,
    alignItems: 'center',
  },
  canvasFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE7DD',
    padding: 8,
  },
  text: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: light.text,
  },
});
