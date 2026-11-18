// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  buildSearchUrl,
  SEARCH_ENGINES,
  validateSearchTemplate,
} from '../shared/search.mjs';
import {
  DEFAULT_SETTINGS,
  migrateSettings,
  validateSettings,
} from './settings.mjs';

describe('configured search destinations', () => {
  it.each(SEARCH_ENGINES)(
    'builds a $label search with the intended query',
    (engine) => {
      const url = new URL(
        buildSearchUrl('take off', {
          searchEngine: engine.id,
          customSearchUrl: '',
        }),
      );
      expect(url.protocol).toBe('https:');
      expect(url.searchParams.get('q')).toBe('take off meaning');
      expect(url.hostname).toBe(
        new URL(engine.template.replace('{query}', 'test')).hostname,
      );
    },
  );
  it('encodes the exact phrase once while preserving custom path and static parameters', () => {
    const url = buildSearchUrl('  déjà   vu ', {
      searchEngine: 'custom',
      customSearchUrl:
        'https://example.com/define/{query}?source=WordPeek&next=%2Fhome',
    });
    expect(url).toBe(
      'https://example.com/define/d%C3%A9j%C3%A0%20vu?source=WordPeek&next=%2Fhome',
    );
    expect(url).not.toContain('meaning');
    expect(
      buildSearchUrl("reader's", {
        searchEngine: 'custom',
        customSearchUrl: 'https://example.com/?q={query}&lang=en',
      }),
    ).toBe('https://example.com/?q=reader%27s&lang=en');
  });
  it.each([
    'javascript:alert({query})',
    'file:///C:/secret/{query}',
    'http://example.com/?q={query}',
    'https://user:password@example.com/?q={query}',
    'https://{query}.example.com/search',
    'https://example.com/search',
    'https://example.com/{query}?q={query}',
    'https://example.com/?q={query}&other={unknown}',
    'https://example.com/#q={query}',
    'https://example.com/' + 'a'.repeat(2048) + '?q={query}',
  ])('rejects invalid or unsafe templates: %s', (template) => {
    expect(() => validateSearchTemplate(template)).toThrow();
  });
  it('refuses arbitrary engine identifiers and invalid selected text', () => {
    expect(() =>
      buildSearchUrl('test', { searchEngine: 'unknown', customSearchUrl: '' }),
    ).toThrow();
    expect(() => buildSearchUrl('<script>')).toThrow();
    expect(() => buildSearchUrl('a'.repeat(81))).toThrow();
  });
});

describe('preference migration and validation', () => {
  it('keeps old shortcut/clipboard choices when adding search preferences', () => {
    expect(
      migrateSettings({ shortcut: 'Control+Shift+Q', clipboardFallback: true }),
    ).toEqual({
      ...DEFAULT_SETTINGS,
      shortcut: 'Control+Shift+Q',
      clipboardFallback: true,
    });
  });
  it('preserves a valid custom URL across restarts', () => {
    const preferences = {
      ...DEFAULT_SETTINGS,
      searchEngine: 'custom',
      customSearchUrl: 'https://example.com/word/{query}',
    };
    expect(migrateSettings(preferences)).toEqual(preferences);
    expect(validateSettings(preferences)).toEqual(preferences);
  });
  it('resets broken search settings on load but rejects invalid saves', () => {
    const invalid = {
      ...DEFAULT_SETTINGS,
      shortcut: 'Control+Alt+Q',
      searchEngine: 'custom',
      customSearchUrl: 'javascript:alert(1)',
    };
    expect(migrateSettings(invalid)).toEqual({
      ...DEFAULT_SETTINGS,
      shortcut: 'Control+Alt+Q',
    });
    expect(() => validateSettings(invalid)).toThrow();
    expect(() =>
      validateSettings({ ...DEFAULT_SETTINGS, clipboardFallback: 'true' }),
    ).toThrow();
  });
});

describe('appearance preferences', () => {
  it('migrates old preferences to System and validates explicit choices', () => {
    expect(migrateSettings({ shortcut: 'Control+Alt+Q' }).appearance).toBe(
      'system',
    );
    for (const appearance of ['system', 'light', 'dark'])
      expect(
        validateSettings({ ...DEFAULT_SETTINGS, appearance }).appearance,
      ).toBe(appearance);
    expect(() =>
      validateSettings({ ...DEFAULT_SETTINGS, appearance: 'sepia' }),
    ).toThrow();
    expect(
      migrateSettings({ ...DEFAULT_SETTINGS, appearance: 'sepia' }).appearance,
    ).toBe('system');
  });
});
