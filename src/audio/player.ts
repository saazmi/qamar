// Playback engine. SPEC §12.5. Single active Sound at a time — call playAyah()
// to preempt anything already playing. Repeat/range/speed are follow-up work.

import { Audio, type AVPlaybackStatus } from 'expo-av';
import { resolveAudioUri } from './cache';

let current: Audio.Sound | null = null;
let generation = 0;

async function unloadCurrent(): Promise<void> {
  if (!current) return;
  try {
    await current.unloadAsync();
  } catch {
    // ignore
  }
  current = null;
}

export interface PlayHandle {
  stop: () => Promise<void>;
}

export async function playAyah(
  surah: number,
  ayah: number,
  opts: { rate?: number; onFinished?: () => void } = {},
): Promise<PlayHandle> {
  const gen = ++generation;
  await unloadCurrent();
  if (gen !== generation) return { stop: async () => {} };

  const uri = await resolveAudioUri(surah, ayah);
  if (gen !== generation) return { stop: async () => {} };

  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true, rate: opts.rate ?? 1, shouldCorrectPitch: true },
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        opts.onFinished?.();
        void unloadCurrent();
      }
    },
  );

  if (gen !== generation) {
    void sound.unloadAsync();
    return { stop: async () => {} };
  }

  current = sound;
  return {
    stop: async () => {
      if (current === sound) await unloadCurrent();
    },
  };
}

export async function stopPlayback(): Promise<void> {
  generation += 1;
  sequenceGen += 1;
  await unloadCurrent();
}

let sequenceGen = 0;

// Traditional recitation prefixes every surah except Al-Fatiha (surah 1,
// whose ayah 1 IS the basmalah) and At-Tawba (surah 9, no basmalah) with
// "Bismillah…". We reuse Al-Fatiha's ayah-1 recording as that prefix, glued
// to the first ayah's highlight so the user sees ayah 1 lit up while the
// basmalah plays.
const BASMALAH_SURAH = 1;
const BASMALAH_AYAH = 1;
function needsBasmalahPrefix(
  surah: number,
  fromAyah: number,
  includeBasmalah: boolean,
): boolean {
  if (!includeBasmalah) return false;
  if (fromAyah !== 1) return false;
  if (surah === 1) return false; // Al-Fatiha
  if (surah === 9) return false; // At-Tawba
  return true;
}

// Play a run of ayat back-to-back. Advances via onFinished callback of each
// track. Returns immediately with a stop() handle; the caller receives per-
// ayah progress via onAyahChange.
export async function playRange(
  surah: number,
  fromAyah: number,
  toAyah: number,
  onAyahChange: (v: { surah: number; ayah: number } | null) => void,
  opts: { rate?: number; includeBasmalah?: boolean } = {},
): Promise<{ stop: () => Promise<void> }> {
  const gen = ++sequenceGen;

  const playNext = async (ayah: number): Promise<void> => {
    if (gen !== sequenceGen) return;
    if (ayah > toAyah) {
      if (gen === sequenceGen) onAyahChange(null);
      return;
    }
    onAyahChange({ surah, ayah });
    await playAyah(surah, ayah, {
      rate: opts.rate,
      onFinished: () => {
        void playNext(ayah + 1);
      },
    });
  };

  if (needsBasmalahPrefix(surah, fromAyah, opts.includeBasmalah ?? false)) {
    // Highlight ayah 1 of the target surah while the basmalah plays.
    onAyahChange({ surah, ayah: 1 });
    await playAyah(BASMALAH_SURAH, BASMALAH_AYAH, {
      rate: opts.rate,
      onFinished: () => {
        void playNext(fromAyah);
      },
    });
  } else {
    await playNext(fromAyah);
  }

  return {
    stop: async () => {
      if (gen === sequenceGen) {
        sequenceGen += 1;
        await unloadCurrent();
      }
    },
  };
}

// Configure the audio session once — background playback + silent-switch safe.
let configured = false;
export async function ensureAudioConfigured(): Promise<void> {
  if (configured) return;
  configured = true;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  } catch {
    // ignore — audio can still play, just with default session behavior
  }
}
