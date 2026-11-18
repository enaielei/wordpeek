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
                ? 'No entry found. Try the base word or search Google.'
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
  google: async (word) => {
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(`${word} meaning`)}`,
      '_blank',
      'noopener,noreferrer',
    );
  },
  source: async (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  },
  hide: async () => undefined,
  context: async () => ({ word: '', message: '', revision: 0 }),
  settings: async () => ({
    shortcut: 'Control+Alt+W',
    clipboardFallback: false,
  }),
  saveSettings: desktopRequired,
  onSelection: () => () => undefined,
};
