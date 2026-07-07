// Numbered migration runner. SPEC §19, §18.4.

export interface Migration {
  version: number;
  up: (exec: (sql: string) => Promise<void>) => Promise<void>;
}

export const migrations: Migration[] = [
  // { version: 1, up: async (exec) => { ... } }, — Phase 0/2
];
