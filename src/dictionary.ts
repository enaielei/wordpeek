import type { DictionaryEntry, Sense } from './types';

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
function words(value: unknown): string[] {
  return Array.isArray(value)
    ? [
        ...new Set(
          value
            .filter(
              (word): word is string =>
                typeof word === 'string' && !!word.trim(),
            )
            .map((word) => word.trim()),
        ),
      ]
    : [];
}
export function allowedUrl(
  value: unknown,
  hosts: string[],
): string | undefined {
  if (typeof value !== 'string') return;
  try {
    const url = new URL(value);
    if (
      url.protocol === 'https:' &&
      hosts.includes(url.hostname) &&
      !url.username &&
      !url.password
    )
      return url.href;
  } catch {
    /* Omit malformed provider URLs. */
  }
}

export function toSenses(entries: DictionaryEntry[]): Sense[] {
  const senses: Sense[] = [];
  const seen = new Set<string>();
  for (const [entryIndex, entry] of entries.entries()) {
    if (!entry || typeof entry !== 'object' || !text(entry.word)) continue;
    const phonetics = Array.isArray(entry.phonetics)
      ? entry.phonetics.filter((item) => item && typeof item === 'object')
      : [];
    const recording = phonetics.find((item) =>
      allowedUrl(item.audio, [
        'upload.wikimedia.org',
        'api.dictionaryapi.dev',
        'ssl.gstatic.com',
      ]),
    );
    const source = Array.isArray(entry.sourceUrls)
      ? entry.sourceUrls
          .map((url) => allowedUrl(url, ['en.wiktionary.org']))
          .find(Boolean)
      : undefined;
    for (const [meaningIndex, meaning] of (Array.isArray(entry.meanings)
      ? entry.meanings
      : []
    ).entries()) {
      if (!meaning || typeof meaning !== 'object') continue;
      const definitions = Array.isArray(meaning.definitions)
        ? meaning.definitions
        : [];
      for (const [definitionIndex, definition] of definitions.entries()) {
        if (!definition || !text(definition.definition)) continue;
        const key = `${entry.word}|${meaning.partOfSpeech}|${definition.definition}`;
        if (seen.has(key)) continue;
        seen.add(key);
        senses.push({
          id: `${entryIndex}-${meaningIndex}-${definitionIndex}`,
          word: entry.word,
          partOfSpeech: text(meaning.partOfSpeech) || 'word',
          phonetic:
            text(entry.phonetic) ||
            phonetics.map((item) => text(item.text)).find(Boolean),
          audio: recording
            ? allowedUrl(recording.audio, [
                'upload.wikimedia.org',
                'api.dictionaryapi.dev',
                'ssl.gstatic.com',
              ])
            : undefined,
          audioSource: recording
            ? allowedUrl(recording.sourceUrl, [
                'commons.wikimedia.org',
                'en.wiktionary.org',
              ])
            : undefined,
          audioLicense: recording?.license,
          definition: definition.definition,
          example: text(definition.example),
          // Part-of-speech-wide relations may describe a different sense.
          synonyms: words(
            definition.synonyms?.length
              ? definition.synonyms
              : definitions.length === 1
                ? meaning.synonyms
                : [],
          ),
          antonyms: words(
            definition.antonyms?.length
              ? definition.antonyms
              : definitions.length === 1
                ? meaning.antonyms
                : [],
          ),
          source,
          license: entry.license,
        });
      }
    }
  }
  return senses;
}
