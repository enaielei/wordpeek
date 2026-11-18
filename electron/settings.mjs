import {
  DEFAULT_SEARCH_SETTINGS,
  validateSearchSettings,
} from '../shared/search.mjs';

export const DEFAULT_SETTINGS = Object.freeze({
  appearance: 'system',
  shortcut: 'Control+Alt+W',
  clipboardFallback: false,
  ...DEFAULT_SEARCH_SETTINGS,
});
const SHORTCUT = /^(?:(?:Control|Alt|Shift|Super)\+){1,3}[A-Z0-9]$/;

export function validateSettings(input) {
  if (
    !input ||
    typeof input.shortcut !== 'string' ||
    input.shortcut.length > 80 ||
    !SHORTCUT.test(input.shortcut)
  )
    throw new Error('Use modifiers and one letter, for example Control+Alt+W.');
  if (typeof input.clipboardFallback !== 'boolean')
    throw new Error('Choose whether clipboard fallback is enabled.');
  if (!['system', 'light', 'dark'].includes(input.appearance))
    throw new Error('Choose System, Light, or Dark appearance.');
  return {
    appearance: input.appearance,
    shortcut: input.shortcut,
    clipboardFallback: input.clipboardFallback,
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
  next.clipboardFallback = input.clipboardFallback === true;
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
