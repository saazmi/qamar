// Verse-scoped note editor. Opens when Notes mode + tap on an ayah.
// Supports two note kinds — text and canvas (mutually exclusive per note).

import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Canvas, CanvasView, parseStrokes, type CanvasHandle } from '@components/notes/Canvas';
import structure from '@content/structure.json';
import { loadSurah } from '@content/text';
import type { AyahText, SurahMeta } from '@content/types';
import { useNotesStore, type Note, type NoteKind } from '@stores/notes';
import { useSessionStore } from '@stores/session';
import { useUiStore } from '@stores/ui';
import { light } from '@theme/colors';

const META = structure as SurahMeta[];
const MAX_TEXT_BODY = 5000; // Text notes only. Canvas notes are unbounded here
                            // (storage-headroom warning surfaced via toast).
const STORAGE_WARN_BYTES = 4 * 1024 * 1024; // ~4 MB — approaching Android AsyncStorage cap.

export function NoteEditorSheet() {
  const target = useSessionStore((s) => s.noteEditor);
  const close = useSessionStore((s) => s.closeNoteEditor);
  const allNotes = useNotesStore((s) => s.notes);
  const addNote = useNotesStore((s) => s.addNote);
  const updateNote = useNotesStore((s) => s.updateNote);
  const removeNote = useNotesStore((s) => s.removeNote);
  const totalBodyBytes = useNotesStore((s) => s.totalBodyBytes);
  const showToast = useUiStore((s) => s.showToast);

  const [draftKind, setDraftKind] = useState<NoteKind>('text');
  const [draftText, setDraftText] = useState('');
  const canvasRef = useRef<CanvasHandle | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const editCanvasRef = useRef<CanvasHandle | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const meta = target ? META.find((m) => m.id === target.surah) : undefined;
  const arabicText = useMemo(() => {
    if (!target) return '';
    const list = loadSurah(target.surah) ?? [];
    return list.find((a: AyahText) => a.ayah === target.ayah)?.text ?? '';
  }, [target]);

  const verseNotes = useMemo(() => {
    if (!target) return [] as Note[];
    return allNotes.filter(
      (n) => n.scope === 'ayah' && n.surah === target.surah && n.ayah === target.ayah,
    );
  }, [allNotes, target]);

  if (!target || !meta) return null;

  const warnIfNearCap = (extraBytes: number) => {
    const projected = totalBodyBytes() + extraBytes;
    if (projected > STORAGE_WARN_BYTES) {
      showToast({
        message: `Stockage: ${(projected / 1024 / 1024).toFixed(1)} MB — pense à supprimer d'anciennes notes.`,
      });
    }
  };

  const handleAdd = () => {
    if (draftKind === 'text') {
      const body = draftText.trim();
      if (!body) return;
      addNote({ scope: 'ayah', kind: 'text', surah: target.surah, ayah: target.ayah, body });
      warnIfNearCap(body.length);
      setDraftText('');
    } else {
      const c = canvasRef.current;
      if (!c || c.isEmpty()) return;
      const body = c.serialize();
      addNote({ scope: 'ayah', kind: 'canvas', surah: target.surah, ayah: target.ayah, body });
      warnIfNearCap(body.length);
      c.clear();
    }
  };

  const handleUpdate = (note: Note) => {
    if (note.kind === 'text') {
      const body = editingBody.trim();
      if (!body) return;
      updateNote(note.id, body);
    } else {
      const c = editCanvasRef.current;
      if (!c) return;
      updateNote(note.id, c.serialize());
    }
    setEditingId(null);
    setEditingBody('');
  };

  const handleDelete = (note: Note) => {
    removeNote(note.id);
    const preview =
      note.kind === 'text'
        ? note.body.slice(0, 40) + (note.body.length > 40 ? '…' : '')
        : 'dessin';
    showToast({
      message: `Note supprimée · ${preview}`,
      actionLabel: 'Annuler',
      onAction: () => {
        addNote({
          scope: 'ayah',
          kind: note.kind,
          surah: note.surah,
          ayah: note.ayah,
          body: note.body,
        });
      },
    });
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditingBody(note.body);
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.avoider}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation?.()}>
            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              <View style={styles.grabber} />

              <View style={styles.headerRow}>
                <Text style={styles.ref}>
                  {meta.nameTransliterated} · {target.surah}:{target.ayah}
                </Text>
                <Pressable onPress={close} hitSlop={12}>
                  <Text style={styles.close}>×</Text>
                </Pressable>
              </View>

              <Text style={styles.arabic} selectable>
                {arabicText}
              </Text>

              <Text style={styles.sectionLabel}>Notes existantes</Text>
              {verseNotes.length === 0 ? (
                <Text style={styles.empty}>Aucune note pour ce verset.</Text>
              ) : (
                verseNotes.map((n) => (
                  <View key={n.id} style={styles.noteCard}>
                    <View style={styles.noteHeader}>
                      <Text style={styles.noteKindPill}>
                        {n.kind === 'canvas' ? '✎ Dessin' : 'T Texte'}
                      </Text>
                    </View>
                    {editingId === n.id ? (
                      n.kind === 'text' ? (
                        <>
                          <TextInput
                            value={editingBody}
                            onChangeText={setEditingBody}
                            multiline
                            maxLength={MAX_TEXT_BODY}
                            style={styles.input}
                            placeholder="Modifier la note…"
                            placeholderTextColor={light.textMuted}
                          />
                          <View style={styles.actionsRow}>
                            <Pressable onPress={() => setEditingId(null)} hitSlop={8}>
                              <Text style={styles.actionMuted}>Annuler</Text>
                            </Pressable>
                            <Pressable onPress={() => handleUpdate(n)} hitSlop={8}>
                              <Text style={styles.action}>Enregistrer</Text>
                            </Pressable>
                          </View>
                        </>
                      ) : (
                        <>
                          <Canvas ref={editCanvasRef} initialStrokes={parseStrokes(n.body)} />
                          <View style={styles.actionsRow}>
                            <Pressable onPress={() => setEditingId(null)} hitSlop={8}>
                              <Text style={styles.actionMuted}>Annuler</Text>
                            </Pressable>
                            <Pressable onPress={() => handleUpdate(n)} hitSlop={8}>
                              <Text style={styles.action}>Enregistrer</Text>
                            </Pressable>
                          </View>
                        </>
                      )
                    ) : (
                      <>
                        {(() => {
                          const expanded = viewingId === n.id;
                          if (n.kind === 'text') {
                            return (
                              <Text
                                style={styles.noteBody}
                                numberOfLines={expanded ? undefined : 2}
                              >
                                {n.body}
                              </Text>
                            );
                          }
                          return expanded ? (
                            <View style={styles.canvasFullWrap}>
                              <CanvasView body={n.body} />
                            </View>
                          ) : (
                            <View style={styles.canvasThumbWrap}>
                              <CanvasView body={n.body} width={110} />
                            </View>
                          );
                        })()}
                        <View style={styles.actionsRow}>
                          <Pressable onPress={() => handleDelete(n)} hitSlop={8}>
                            <Text style={styles.actionMuted}>Supprimer</Text>
                          </Pressable>
                          <Pressable
                            onPress={() =>
                              setViewingId(viewingId === n.id ? null : n.id)
                            }
                            hitSlop={8}
                          >
                            {viewingId === n.id ? (
                              <EyeOff size={18} color={light.textMuted} />
                            ) : (
                              <Eye size={18} color={light.textMuted} />
                            )}
                          </Pressable>
                          <Pressable onPress={() => startEdit(n)} hitSlop={8}>
                            <Text style={styles.action}>Modifier</Text>
                          </Pressable>
                        </View>
                      </>
                    )}
                  </View>
                ))
              )}

              <Text style={styles.sectionLabel}>Nouvelle note</Text>
              <View style={styles.kindToggle}>
                <Pressable
                  onPress={() => setDraftKind('text')}
                  style={[styles.kindBtn, draftKind === 'text' && styles.kindBtnActive]}
                >
                  <Text style={[styles.kindLabel, draftKind === 'text' && styles.kindLabelActive]}>
                    T
                  </Text>
                  <Text style={[styles.kindSub, draftKind === 'text' && styles.kindSubActive]}>
                    Texte
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setDraftKind('canvas')}
                  style={[styles.kindBtn, draftKind === 'canvas' && styles.kindBtnActive]}
                >
                  <Text style={[styles.kindLabel, draftKind === 'canvas' && styles.kindLabelActive]}>
                    ✎
                  </Text>
                  <Text style={[styles.kindSub, draftKind === 'canvas' && styles.kindSubActive]}>
                    Dessin
                  </Text>
                </Pressable>
              </View>

              {draftKind === 'text' ? (
                <TextInput
                  value={draftText}
                  onChangeText={setDraftText}
                  multiline
                  maxLength={MAX_TEXT_BODY}
                  placeholder="Écrivez une note…"
                  placeholderTextColor={light.textMuted}
                  style={styles.input}
                />
              ) : (
                <Canvas ref={canvasRef} />
              )}

              <Pressable onPress={handleAdd} style={styles.addBtn}>
                <Text style={styles.addLabel}>Ajouter</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingTop: 32,
  },
  avoider: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: light.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  arabic: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 22,
    lineHeight: 40,
    color: light.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  empty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: light.textMuted,
    fontStyle: 'italic',
  },
  noteCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5EFE4',
    borderLeftWidth: 3,
    borderLeftColor: light.accentSecondary,
    marginBottom: 8,
  },
  noteHeader: {
    marginBottom: 6,
  },
  noteKindPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    overflow: 'hidden',
  },
  noteBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: light.text,
  },
  canvasThumbWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 4,
    alignSelf: 'flex-start',
  },
  canvasFullWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    alignItems: 'stretch',
  },
  input: {
    borderWidth: 1,
    borderColor: '#EEE7DD',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: light.text,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top' as const,
  },
  kindToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  kindBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F5EFE4',
  },
  kindBtnActive: {
    backgroundColor: light.accent,
  },
  kindLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: light.textMuted,
  },
  kindLabelActive: {
    color: '#FFFFFF',
  },
  kindSub: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  kindSubActive: {
    color: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 8,
  },
  action: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: light.accent,
  },
  actionMuted: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: light.textMuted,
  },
  addBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: light.accent,
    alignItems: 'center',
  },
  addLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
