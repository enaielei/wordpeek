import { describe, expect, it } from 'vitest';
import { allowedUrl, toSenses } from './dictionary';
import { fixture } from './test/fixtures';

describe('sense normalization', () => {
  it('keeps examples and relationships attached to each meaning', () => {
    const senses = toSenses(fixture);
    expect(senses).toHaveLength(2);
    expect(senses[0].synonyms).toEqual(['luminous', 'shining']);
    expect(senses[1].example).toContain('student');
    expect(senses[1].synonyms).toEqual(['clever']);
    expect(senses[0].license?.name).toBe('CC BY-SA 3.0');
    expect(senses[0].source).toBe('https://en.wiktionary.org/wiki/bright');
  });
  it('preserves part-of-speech relations with their broader scope', () => {
    const entry = structuredClone(fixture);
    entry[0].meanings![0].definitions![0].synonyms = [];
    expect(toSenses(entry)[0].synonyms).toEqual([
      'not necessarily matched to the current sense',
    ]);
    expect(toSenses(entry)[0].synonymsScope).toBe('partOfSpeech');
  });
  it('omits unavailable data, rejects untrusted audio, and deduplicates senses', () => {
    const entries = [
      {
        word: 'test',
        phonetics: [{ audio: 'https://evil.example/audio.mp3' }],
        meanings: [
          {
            partOfSpeech: 'noun',
            definitions: [
              { definition: 'A check.' },
              { definition: 'A check.' },
            ],
          },
        ],
      },
    ];
    const senses = toSenses(entries);
    expect(senses).toHaveLength(1);
    expect(senses[0].audio).toBeUndefined();
    expect(senses[0].example).toBeUndefined();
    expect(senses[0].antonyms).toEqual([]);
  });
  it('rejects source URLs that only resemble allowed hosts', () => {
    expect(
      allowedUrl('https://en.wiktionary.org.evil.example/test', [
        'en.wiktionary.org',
      ]),
    ).toBeUndefined();
    expect(
      allowedUrl('javascript:alert(1)', ['en.wiktionary.org']),
    ).toBeUndefined();
    expect(
      allowedUrl('https://user:password@en.wiktionary.org/', [
        'en.wiktionary.org',
      ]),
    ).toBeUndefined();
  });
});
