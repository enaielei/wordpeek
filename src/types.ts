import type { SearchPreferences } from '../shared/search.mjs';
export interface License {
  name: string;
  url: string;
}
export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics?: {
    text?: string;
    audio?: string;
    sourceUrl?: string;
    license?: License;
  }[];
  meanings?: {
    partOfSpeech: string;
    synonyms?: string[];
    antonyms?: string[];
    definitions?: {
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }[];
  }[];
  license?: License;
  sourceUrls?: string[];
}
export interface Sense {
  id: string;
  word: string;
  partOfSpeech: string;
  phonetic?: string;
  audio?: string;
  audioSource?: string;
  audioLicense?: License;
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
  source?: string;
  license?: License;
}
export interface SelectionContext {
  word: string;
  message: string;
  revision: number;
}
export interface Settings extends SearchPreferences {
  appearance: 'system' | 'light' | 'dark';
  shortcut: string;
  clipboardFallback: boolean;
}
export type LookupResult =
  | { ok: true; entries: DictionaryEntry[] }
  | { ok: false; error: { code: string; message: string } };
export interface DesktopBridge {
  lookup(word: string): Promise<LookupResult>;
  search(word: string): Promise<void>;
  source(url: string): Promise<void>;
  resize(height: number): Promise<void>;
  hide(): Promise<void>;
  context(): Promise<SelectionContext>;
  settings(): Promise<Settings>;
  saveSettings(
    settings: Settings,
  ): Promise<{ ok: boolean; message?: string; settings?: Settings }>;
  onSettingsChanged(callback: (settings: Settings) => void): () => void;
  onOpenSettings(callback: (payload: { message: string }) => void): () => void;
  onSelection(callback: (context: SelectionContext) => void): () => void;
}
declare global {
  interface Window {
    wordpeek?: DesktopBridge;
  }
}
