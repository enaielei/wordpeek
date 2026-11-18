// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from './settings.mjs';
import { trayTemplate } from './tray.mjs';

function setup(settings = DEFAULT_SETTINGS) {
  const actions = {
    open: vi.fn(),
    settings: vi.fn(),
    quit: vi.fn(),
    update: vi.fn().mockResolvedValue({ ok: true }),
  };
  const menu = trayTemplate(settings, actions);
  return { menu, actions, item: (id) => menu.find((item) => item.id === id) };
}

describe('tray quick settings', () => {
  it('routes dictionary, settings, and quit independently', () => {
    const { item, actions } = setup();
    for (const [id, action] of [
      ['open', 'open'],
      ['settings', 'settings'],
      ['quit', 'quit'],
    ]) {
      item(id).click();
      expect(actions[action]).toHaveBeenCalledTimes(1);
    }
  });
  it('reflects the saved engine and updates only that preference', () => {
    const { item, actions } = setup({
      ...DEFAULT_SETTINGS,
      searchEngine: 'duckduckgo',
    });
    const engines = item('search').submenu;
    expect(
      engines.find((engine) => engine.id === 'engine-duckduckgo').checked,
    ).toBe(true);
    expect(
      engines.find((engine) => engine.id === 'engine-google').checked,
    ).toBe(false);
    engines.find((engine) => engine.id === 'engine-bing').click();
    expect(actions.update).toHaveBeenCalledWith({ searchEngine: 'bing' });
    expect(
      engines.find((engine) => engine.id === 'engine-custom').enabled,
    ).toBe(false);
  });
  it('enables a custom destination and independently toggles triggers', () => {
    const { item, actions } = setup({
      ...DEFAULT_SETTINGS,
      customSearchUrl: 'https://example.com/?q={query}',
      autoPopupEnabled: true,
    });
    expect(
      item('search').submenu.find((engine) => engine.id === 'engine-custom')
        .enabled,
    ).toBe(true);
    expect(item('auto-trigger').checked).toBe(true);
    item('auto-trigger').click();
    expect(actions.update).toHaveBeenCalledWith({ autoPopupEnabled: false });
  });
});
