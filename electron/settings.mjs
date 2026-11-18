import {
  DEFAULT_SEARCH_SETTINGS,
  validateSearchSettings,
} from '../shared/search.mjs';

export const DEFAULT_DETAILS = Object.freeze({
  definition: true,
  partOfSpeech: true,
  phonetic: true,
  pronunciation: true,
  example: true,
  synonyms: true,
  antonyms: true,
});

export const DEFAULT_SETTINGS = Object.freeze({
  appearance: 'system',
  shortcut: 'Control+Alt+W',
  shortcutEnabled: true,
  autoPopupEnabled: false,
  details: DEFAULT_DETAILS,
  ...DEFAULT_SEARCH_SETTINGS,
});
const SHORTCUT = /^(?:(?:Control|Alt|Shift|Super)\+){1,4}[A-Z0-9]$/;

export function validateSettings(input) {
  if (
    !input ||
    typeof input.shortcut !== 'string' ||
    input.shortcut.length > 80 ||
    !SHORTCUT.test(input.shortcut)
  )
    throw new Error('Use modifiers and one letter, for example Control+Alt+W.');
  if (
    typeof input.shortcutEnabled !== 'boolean' ||
    typeof input.autoPopupEnabled !== 'boolean' ||
    (!input.shortcutEnabled && !input.autoPopupEnabled)
  )
    throw new Error('Enable the shortcut, automatic selection, or both.');
  if (
    !input.details ||
    Object.keys(DEFAULT_DETAILS).some(
      (key) => typeof input.details[key] !== 'boolean',
    ) ||
    !Object.keys(DEFAULT_DETAILS).some((key) => input.details[key])
  )
    throw new Error('Choose at least one word detail.');
  if (!['system', 'light', 'dark'].includes(input.appearance))
    throw new Error('Choose System, Light, or Dark appearance.');
  return {
    appearance: input.appearance,
    shortcut: input.shortcut,
    shortcutEnabled: input.shortcutEnabled,
    autoPopupEnabled: input.autoPopupEnabled,
    details: Object.fromEntries(
      Object.keys(DEFAULT_DETAILS).map((key) => [key, input.details[key]]),
    ),
    ...validateSearchSettings(input),
  };
}

export function migrateSettings(input) {
  const next = { ...DEFAULT_SETTINGS };
  if (!input || typeof input !== 'object') return next;
  if (
    typeof input.shortcut === 'string' &&
    input.shortcut.length <= 80 &&
    SHORTCUT.test(input.shortcut)
  )
    next.shortcut = input.shortcut;
  if (['system', 'light', 'dark'].includes(input.appearance))
    next.appearance = input.appearance;
  next.shortcutEnabled = input.shortcutEnabled !== false;
  next.autoPopupEnabled = input.autoPopupEnabled === true;
  if (!next.shortcutEnabled && !next.autoPopupEnabled)
    next.shortcutEnabled = true;
  next.details = { ...DEFAULT_DETAILS };
  for (const key of Object.keys(DEFAULT_DETAILS))
    if (typeof input.details?.[key] === 'boolean')
      next.details[key] = input.details[key];
  if (!Object.values(next.details).some(Boolean))
    next.details = { ...DEFAULT_DETAILS };
  try {
    Object.assign(
      next,
      validateSearchSettings({
        ...DEFAULT_SEARCH_SETTINGS,
        searchEngine: input.searchEngine ?? 'google',
        customSearchUrl: input.customSearchUrl ?? '',
      }),
    );
  } catch {
    /* Retain valid core preferences and reset invalid search configuration. */
  }
  return next;
}
