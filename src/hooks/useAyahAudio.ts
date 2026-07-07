// Thin wrapper that lets a component play/stop a single ayah with state.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureAudioConfigured, playAyah, stopPlayback } from '@audio/player';

interface PlayingKey {
  surah: number;
  ayah: number;
}

export function useAyahAudio() {
  const [playing, setPlaying] = useState<PlayingKey | null>(null);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    void ensureAudioConfigured();
    return () => {
      mounted.current = false;
      void stopPlayback();
    };
  }, []);

  const play = useCallback(async (surah: number, ayah: number) => {
    setLoading(true);
    try {
      await playAyah(surah, ayah, {
        onFinished: () => {
          if (mounted.current) setPlaying(null);
        },
      });
      if (mounted.current) {
        setPlaying({ surah, ayah });
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const stop = useCallback(async () => {
    await stopPlayback();
    if (mounted.current) setPlaying(null);
  }, []);

  const isPlaying = useCallback(
    (surah: number, ayah: number) =>
      playing?.surah === surah && playing?.ayah === ayah,
    [playing],
  );

  return { play, stop, loading, isPlaying };
}
