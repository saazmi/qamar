// Qari registry + URL builders. SPEC §12.2.
// D3 (2026-07-07): owner is still verifying licensing. EveryAyah's terms
// allow non-commercial redistribution with attribution — used here as a
// placeholder pending owner confirmation.

export interface QariSource {
  id: string;
  displayName: string;
  buildUrl: (surah: number, ayah: number) => string;
  attribution: string;
}

const pad3 = (n: number): string => n.toString().padStart(3, '0');

export const QARIS: readonly QariSource[] = [
  {
    id: 'husary-murattal',
    displayName: 'Mahmoud Khalil Al-Husary (murattal)',
    // EveryAyah per-ayah file layout: {surah:3}{ayah:3}.mp3
    buildUrl: (surah, ayah) =>
      `https://everyayah.com/data/Husary_128kbps/${pad3(surah)}${pad3(ayah)}.mp3`,
    attribution: 'Mahmoud Khalil Al-Husary via everyayah.com',
  },
];

export const DEFAULT_QARI = QARIS[0]!;

export function urlFor(surah: number, ayah: number): string {
  return DEFAULT_QARI.buildUrl(surah, ayah);
}
