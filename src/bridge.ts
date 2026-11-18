import { buildSearchUrl, DEFAULT_SEARCH_SETTINGS } from '../shared/search.mjs';
import type { DesktopBridge } from './types';

const desktopRequired = async () => {
  throw new Error('Open the desktop app to use this action.');
};
export const bridge: DesktopBridge = window.wordpeek ?? {
  lookup: async (word) => {
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
        { signal: AbortSignal.timeout(10_000) },
      );
      if (!response.ok)
        return {
          ok: false,
          error: {
            code: 'unavailable',
            message:
              response.status === 404
                ? 'No entry found. Try the base word or search the web.'
                : 'The dictionary is unavailable. Try again.',
          },
        };
      return { ok: true, entries: await response.json() };
    } catch {
      return {
        ok: false,
        error: {
          code: 'network',
          message:
            'Couldn’t reach the dictionary. Check your connection, then try again.',
        },
      };
    }
  },
  recordShortcut: async () => undefined,
  speak: async (word) => {
    if (!('speechSynthesis' in window)) return { ok: false };
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return { ok: true };
  },
  search: async (word) => {
    window.open(buildSearchUrl(word), '_blank', 'noopener,noreferrer');
  },
  source: async (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  },
  resize: async () => undefined,
  hide: async () => undefined,
  context: async () => ({ word: '', message: '', revision: 0 }),
  settings: async () => ({
    appearance: 'system',
    shortcut: 'Control+Alt+W',
    shortcutEnabled: true,
    autoPopupEnabled: false,
    details: {
      definition: true,
      partOfSpeech: true,
      phonetic: true,
      pronunciation: true,
      example: true,
      synonyms: true,
      antonyms: true,
    },
    ...DEFAULT_SEARCH_SETTINGS,
  }),
  saveSettings: desktopRequired,
  onSettingsChanged: () => () => undefined,
  onOpenSettings: () => () => undefined,
  onSelection: () => () => undefined,
};
