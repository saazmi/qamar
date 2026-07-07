// Chunk derivation. SPEC §14.1. Recomputed from records on demand, never stored.

import type { AyahRecord, AyahIndexEntry, Chunk } from './types';

export function deriveChunks(
  _records: AyahRecord[],
  _ayahIndex: Record<string, AyahIndexEntry>,
): Chunk[] {
  throw new Error('not implemented — Phase 2 (SPEC §25)');
}
