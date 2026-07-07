// Qari registry + URL builders. SPEC §12.2.
// Abstracts CDN/host behind a QariSource interface so adding qaris is config, not code.

export interface QariSource {
  id: string;
  displayName: string;
  buildUrl: (surah: number, ayah: number) => string;
  licenseNote: string;
}

export const QARIS: QariSource[] = [
  // TBD Phase 1 — SPEC D3
];
