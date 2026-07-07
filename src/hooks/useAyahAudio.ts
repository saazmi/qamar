// Thin wrapper that lets a component play/stop a single ayah with state.
// Syncs with session.playingAyah so all three renderings (continuous,
// fragmented, verse sheet) show the same highlight.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureAudioConfigured, playAyah, stopPlayback } from '@audio/player';
import { useSessionStore } from '@stores/session';

export function useAyahAudio() {
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);
  const setPlayingAyah = useSessionStore((s) => s.setPlayingAyah);
  const playingAyah = useSessionStore((s) => s.playingAyah);

  useEffect(() => {
    void ensureAudioConfigured();
    return () => {
      mounted.current = false;
    };
  }, []);

  const play = useCallback(
    async (surah: number, ayah: number) => {
      setLoading(true);
      try {
        setPlayingAyah({ surah, ayah });
        await playAyah(surah, ayah, {
          onFinished: () => {
            if (mounted.current) setPlayingAyah(null);
          },
        });
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [setPlayingAyah],
  );

  const stop = useCallback(async () => {
    await stopPlayback();
    setPlayingAyah(null);
  }, [setPlayingAyah]);

  const isPlaying = useCallback(
    (surah: number, ayah: number) =>
      playingAyah?.surah === surah && playingAyah?.ayah === ayah,
    [playingAyah],
  );

  return { play, stop, loading, isPlaying };
}
