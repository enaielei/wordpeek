export const SEARCH_ENGINES = Object.freeze([
  {
    id: 'google',
    label: 'Google',
    template: 'https://www.google.com/search?q={query}%20meaning',
  },
  {
    id: 'bing',
    label: 'Bing',
    template: 'https://www.bing.com/search?q={query}%20meaning',
  },
  {
    id: 'duckduckgo',
    label: 'DuckDuckGo',
    template: 'https://duckduckgo.com/?q={query}%20meaning',
  },
  {
    id: 'brave',
    label: 'Brave Search',
    template: 'https://search.brave.com/search?q={query}%20meaning',
  },
  {
    id: 'ecosia',
    label: 'Ecosia',
    template: 'https://www.ecosia.org/search?q={query}%20meaning',
  },
]);

export const DEFAULT_SEARCH_SETTINGS = Object.freeze({
  searchEngine: 'google',
  customSearchUrl: '',
});

export function validateSearchTemplate(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2048)
    throw new Error('Enter an HTTPS URL with one {query} placeholder.');
  const template = value.trim();
  if (
    template.split('{query}').length !== 2 ||
    /[{}]/u.test(template.replace('{query}', ''))
  )
    throw new Error(
      'Include {query} exactly once, in the path or query string.',
    );
  let url;
  try {
    url = new URL(template.replace('{query}', 'WORDPEEK_QUERY'));
  } catch {
    throw new Error(
      'Enter a valid HTTPS URL, such as https://example.com/search?q={query}.',
    );
  }
  if (
    url.protocol !== 'https:' ||
    !url.hostname ||
    url.username ||
    url.password
  )
    throw new Error('Use an HTTPS URL without a username or password.');
  const authority = template.match(/^https:\/\/([^/?#]*)/iu)?.[1];
  if (!authority || authority.includes('{query}'))
    throw new Error(
      'Place {query} in the path or query string, after the website address.',
    );
  if (
    template.indexOf('{query}') > template.indexOf('#') &&
    template.includes('#')
  )
    throw new Error('Place {query} before the URL fragment (#).');
  return template;
}

export function validateSearchSettings(input) {
  if (
    !input ||
    typeof input.searchEngine !== 'string' ||
    ![...SEARCH_ENGINES.map((engine) => engine.id), 'custom'].includes(
      input.searchEngine,
    )
  )
    throw new Error('Choose a supported search engine.');
  if (typeof input.customSearchUrl !== 'string')
    throw new Error('Enter a custom URL as text.');
  const customSearchUrl = input.customSearchUrl.trim();
  if (customSearchUrl || input.searchEngine === 'custom')
    validateSearchTemplate(customSearchUrl);
  return { searchEngine: input.searchEngine, customSearchUrl };
}

export function buildSearchUrl(value, preferences = DEFAULT_SEARCH_SETTINGS) {
  const settings = validateSearchSettings(preferences);
  if (typeof value !== 'string')
    throw new Error('Enter an English word or short phrase.');
  const query = value.trim().normalize('NFC').replace(/\s+/gu, ' ');
  if (!query || query.length > 80 || !/^[\p{L}\p{M} '\u2019-]+$/u.test(query))
    throw new Error(
      'Enter an English word or short phrase, up to 80 characters.',
    );
  const template =
    settings.searchEngine === 'custom'
      ? settings.customSearchUrl
      : SEARCH_ENGINES.find((engine) => engine.id === settings.searchEngine)
          .template;
  const encoded = encodeURIComponent(query).replace(
    /[!'()*]/gu,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return new URL(template.replace('{query}', encoded)).href;
}

export function searchLabel(preferences) {
  return (
    SEARCH_ENGINES.find((engine) => engine.id === preferences.searchEngine)
      ?.label || 'Custom search'
  );
}
