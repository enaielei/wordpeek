const ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
export const MAX_QUERY_LENGTH = 80;

export class LookupError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function normalizeQuery(value) {
  if (typeof value !== 'string')
    throw new LookupError('invalid', 'Enter an English word or short phrase.');
  const word = value.trim().normalize('NFC').replace(/\s+/gu, ' ');
  if (
    !word ||
    word.length > MAX_QUERY_LENGTH ||
    !/^[\p{L}\p{M} '\u2019-]+$/u.test(word)
  ) {
    throw new LookupError(
      'invalid',
      'Enter an English word or short phrase, up to 80 characters.',
    );
  }
  return word;
}

export function googleUrl(word) {
  const url = new URL('https://www.google.com/search');
  url.searchParams.set('q', `${normalizeQuery(word)} meaning`);
  return url.href;
}

export function safeSource(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      [
        'en.wiktionary.org',
        'commons.wikimedia.org',
        'creativecommons.org',
        'dictionaryapi.dev',
      ].includes(url.hostname) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function safeAudio(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      [
        'upload.wikimedia.org',
        'api.dictionaryapi.dev',
        'ssl.gstatic.com',
      ].includes(url.hostname) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export async function fetchEntry(query, fetcher = fetch) {
  const word = normalizeQuery(query);
  try {
    const response = await fetcher(
      `${ENDPOINT}${encodeURIComponent(word.toLowerCase())}`,
      {
        signal: AbortSignal.timeout(10_000),
        redirect: 'error',
        headers: { Accept: 'application/json' },
      },
    );
    if (response.status === 404)
      throw new LookupError(
        'not-found',
        'No entry found. Try the base word or search the web.',
      );
    if (response.status === 429)
      throw new LookupError(
        'rate-limit',
        'The dictionary is busy. Wait a moment, then try again.',
      );
    if (!response.ok)
      throw new LookupError(
        'unavailable',
        'The dictionary is unavailable. Try again or search the web.',
      );
    if (!response.body)
      throw new LookupError(
        'unavailable',
        'The dictionary returned an empty response. Try again.',
      );
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let body = '';
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 1_000_000)
          throw new LookupError(
            'unavailable',
            'This dictionary entry is too large. Search the web instead.',
          );
        body += decoder.decode(value, { stream: true });
      }
      body += decoder.decode();
    } finally {
      await reader.cancel();
    }
    const entries = JSON.parse(body);
    if (!Array.isArray(entries) || !entries.length)
      throw new LookupError(
        'unavailable',
        'The dictionary returned an unreadable entry. Try again.',
      );
    return entries;
  } catch (error) {
    if (error instanceof LookupError) throw error;
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError')
      throw new LookupError(
        'timeout',
        'The dictionary took too long. Try again or search the web.',
      );
    throw new LookupError(
      'network',
      'Couldn’t reach the dictionary. Check your connection, then try again.',
    );
  }
}
