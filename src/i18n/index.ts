// i18n entry. SPEC §17. Keys in English, values per locale.
// Zero hardcoded strings elsewhere (SPEC §26 gate).

import fr from './locales/fr.json';

export const locales = { fr } as const;
export type LocaleKey = keyof typeof locales;
