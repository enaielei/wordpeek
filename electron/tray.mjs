import { SEARCH_ENGINES, validateSearchTemplate } from '../shared/search.mjs';

export function trayTemplate(settings, actions) {
  let customAvailable = false;
  try {
    validateSearchTemplate(settings.customSearchUrl);
    customAvailable = true;
  } catch {
    /* Custom search becomes selectable after a valid URL is saved. */
  }
  const update = (patch) => void actions.update(patch);
  return [
    { id: 'open', label: 'Open WordPeek', click: actions.open },
    { id: 'clipboard', label: 'Look Up Clipboard', click: actions.clipboard },
    { type: 'separator' },
    { id: 'settings', label: 'Settings…', click: actions.settings },
    {
      id: 'appearance',
      label: 'Appearance',
      submenu: ['system', 'light', 'dark'].map((value) => ({
        id: 'appearance-' + value,
        label: value[0].toUpperCase() + value.slice(1),
        type: 'radio',
        checked: settings.appearance === value,
        click: () => update({ appearance: value }),
      })),
    },
    {
      id: 'search',
      label: 'Search Engine',
      submenu: [
        ...SEARCH_ENGINES.map((engine) => ({
          id: `engine-${engine.id}`,
          label: engine.label,
          type: 'radio',
          checked: settings.searchEngine === engine.id,
          click: () => update({ searchEngine: engine.id }),
        })),
        {
          id: 'engine-custom',
          label: customAvailable
            ? 'Custom URL'
            : 'Custom URL (set in Settings)',
          type: 'radio',
          checked: settings.searchEngine === 'custom',
          enabled: customAvailable,
          click: () => update({ searchEngine: 'custom' }),
        },
      ],
    },
    {
      id: 'clipboard-fallback',
      label: 'Clipboard Fallback',
      type: 'checkbox',
      checked: settings.clipboardFallback,
      click: () => update({ clipboardFallback: !settings.clipboardFallback }),
    },
    { type: 'separator' },
    { id: 'quit', label: 'Quit WordPeek', click: actions.quit },
  ];
}
