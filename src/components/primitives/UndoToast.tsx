// Undo toast host. SPEC §15.3 — undo, never confirm; 5s TTL.
// Mounted once in the root layout. Reads toasts from ui store; auto-expires.

import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useUiStore } from '@stores/ui';
import { light } from '@theme/colors';

export function UndoToastHost() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);
  const clearExpired = useUiStore((s) => s.clearExpiredToasts);

  useEffect(() => {
    if (!toasts.length) return;
    const nextExpiry = Math.min(...toasts.map((t) => t.expiresAt));
    const ms = Math.max(50, nextExpiry - Date.now());
    const handle = setTimeout(clearExpired, ms);
    return () => clearTimeout(handle);
  }, [toasts, clearExpired]);

  if (!toasts.length) return null;

  const top = toasts[toasts.length - 1]!;

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <View style={styles.toast}>
        <Text style={styles.message}>{top.message}</Text>
        {top.actionLabel && top.onAction ? (
          <Pressable
            onPress={() => {
              top.onAction?.();
              dismiss(top.id);
            }}
            hitSlop={8}
          >
            <Text style={styles.action}>{top.actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: light.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 260,
    maxWidth: 480,
    gap: 16,
  },
  message: {
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    flex: 1,
  },
  action: {
    color: light.accentSecondary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
