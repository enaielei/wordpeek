export type SearchEngineId =
  'google' | 'bing' | 'duckduckgo' | 'brave' | 'ecosia' | 'custom';
export interface SearchPreferences {
  searchEngine: SearchEngineId;
  customSearchUrl: string;
}
export const SEARCH_ENGINES: readonly {
  id: Exclude<SearchEngineId, 'custom'>;
  label: string;
  template: string;
}[];
export const DEFAULT_SEARCH_SETTINGS: Readonly<SearchPreferences>;
export function validateSearchTemplate(value: unknown): string;
export function validateSearchSettings(input: unknown): SearchPreferences;
export function buildSearchUrl(
  value: string,
  preferences?: SearchPreferences,
): string;
export function searchLabel(preferences: SearchPreferences): string;
