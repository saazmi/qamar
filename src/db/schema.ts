// SQLite schema description. SPEC §19.1.

export const SCHEMA_VERSION = 1;

export const TABLES = {
  ayah_state: `
    CREATE TABLE IF NOT EXISTS ayah_state (
      surah INTEGER NOT NULL,
      ayah INTEGER NOT NULL,
      state TEXT NOT NULL CHECK (state IN ('learning','memorized')),
      updated_at TEXT NOT NULL,
      memorized_at TEXT,
      last_reviewed_at TEXT,
      review_count INTEGER NOT NULL DEFAULT 0,
      ladder_offset INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (surah, ayah)
    );
  `,
  ayah_state_state_idx: `CREATE INDEX IF NOT EXISTS idx_ayah_state_state ON ayah_state(state);`,
  ayah_state_reviewed_idx: `CREATE INDEX IF NOT EXISTS idx_ayah_state_last_reviewed ON ayah_state(last_reviewed_at);`,
  notes: `
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      scope TEXT NOT NULL CHECK (scope IN ('ayah','surah')),
      surah INTEGER NOT NULL,
      ayah INTEGER,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
  notes_ref_idx: `CREATE INDEX IF NOT EXISTS idx_notes_ref ON notes(surah, ayah);`,
  activity_log: `
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      surah INTEGER,
      ayah_from INTEGER,
      ayah_to INTEGER,
      at TEXT NOT NULL
    );
  `,
  audio_cache: `
    CREATE TABLE IF NOT EXISTS audio_cache (
      qari TEXT NOT NULL,
      surah INTEGER NOT NULL,
      ayah INTEGER NOT NULL,
      bytes INTEGER NOT NULL,
      cached_at TEXT NOT NULL,
      PRIMARY KEY (qari, surah, ayah)
    );
  `,
  meta: `
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `,
};
