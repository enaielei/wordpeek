import type { DictionaryEntry } from '../types';

// Deliberately authored test content, not a scraped or bundled dictionary.
export const fixture: DictionaryEntry[] = [
  {
    word: 'bright',
    phonetic: '/braɪt/',
    phonetics: [{ audio: 'https://upload.wikimedia.org/test/bright.ogg' }],
    license: {
      name: 'CC BY-SA 3.0',
      url: 'https://creativecommons.org/licenses/by-sa/3.0/',
    },
    sourceUrls: ['https://en.wiktionary.org/wiki/bright'],
    meanings: [
      {
        partOfSpeech: 'adjective',
        synonyms: ['not necessarily matched to the current sense'],
        definitions: [
          {
            definition: 'Giving off a lot of light.',
            example: 'A bright lamp lit the room.',
            synonyms: ['luminous', 'shining'],
            antonyms: ['dim'],
          },
          {
            definition: 'Quick to learn.',
            example: 'The bright student solved the puzzle.',
            synonyms: ['clever'],
            antonyms: ['unintelligent'],
          },
        ],
      },
    ],
  },
];
