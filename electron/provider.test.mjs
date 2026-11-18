// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  fetchEntry,
  googleUrl,
  normalizeQuery,
  safeAudio,
  safeSource,
} from './provider.mjs';

describe('online provider boundary', () => {
  it('normalizes a short phrase and rejects document-like or executable input', () => {
    expect(normalizeQuery('  take   off ')).toBe('take off');
    for (const invalid of [
      '',
      'a'.repeat(81),
      '<script>',
      'hello; calc.exe',
      42,
    ])
      expect(() => normalizeQuery(invalid)).toThrow();
  });
  it('constructs a fixed Google HTTPS search with encoded query parameters', () => {
    const url = new URL(googleUrl('take off'));
    expect(url.origin).toBe('https://www.google.com');
    expect(url.searchParams.get('q')).toBe('take off meaning');
    expect(() => googleUrl('https://evil.example')).toThrow();
  });
  it('only permits intended source/audio hosts and rejects credentials', () => {
    expect(safeSource('https://en.wiktionary.org/wiki/test')).toBeTruthy();
    expect(safeSource('file:///C:/secret')).toBeNull();
    expect(safeSource('https://en.wiktionary.org.evil.example')).toBeNull();
    expect(safeAudio('https://upload.wikimedia.org/example.ogg')).toBeTruthy();
    expect(
      safeAudio('https://user:pass@upload.wikimedia.org/example.ogg'),
    ).toBeNull();
  });
  it('preserves provider provenance and encodes the word', async () => {
    const entry = [{ word: 'take off', license: { name: 'test license' } }];
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(entry)));
    expect(await fetchEntry('take off', fetcher)).toEqual(entry);
    expect(fetcher.mock.calls[0][0]).toBe(
      'https://api.dictionaryapi.dev/api/v2/entries/en/take%20off',
    );
    expect(fetcher.mock.calls[0][1].redirect).toBe('error');
  });
  it.each([
    [404, 'not-found'],
    [429, 'rate-limit'],
    [503, 'unavailable'],
  ])('maps HTTP %s into a useful failure', async (status, code) => {
    await expect(
      fetchEntry('test', async () => new Response('', { status })),
    ).rejects.toMatchObject({ code });
  });
  it('bounds oversized responses and rejects invalid JSON', async () => {
    await expect(
      fetchEntry('test', async () => new Response('a'.repeat(1_000_001))),
    ).rejects.toMatchObject({ code: 'unavailable' });
    await expect(
      fetchEntry('test', async () => new Response('not json')),
    ).rejects.toMatchObject({ code: 'network' });
  });
  it('maps timeouts and connection failures', async () => {
    await expect(
      fetchEntry('test', async () => {
        throw new DOMException('timeout', 'TimeoutError');
      }),
    ).rejects.toMatchObject({ code: 'timeout' });
    await expect(
      fetchEntry('test', async () => {
        throw new TypeError('network');
      }),
    ).rejects.toMatchObject({ code: 'network' });
  });
});
