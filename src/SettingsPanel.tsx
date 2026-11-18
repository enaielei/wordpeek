import { Check } from 'lucide-react';
import { CompactSelect } from './components/CompactSelect';
import { ShortcutInput } from './components/ShortcutInput';
import { buildSearchUrl, SEARCH_ENGINES } from '../shared/search.mjs';
import type { SearchEngineId } from '../shared/search.mjs';
import type { Settings } from './types';

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onSave: () => void;
  saving: boolean;
  message: string;
}
const details: [keyof Settings['details'], string][] = [
  ['definition', 'Meaning'],
  ['partOfSpeech', 'Part of speech'],
  ['phonetic', 'Phonetic spelling'],
  ['pronunciation', 'Pronunciation button'],
  ['example', 'Usage example'],
  ['synonyms', 'Synonyms'],
  ['antonyms', 'Antonyms'],
];

export function SettingsPanel({
  settings,
  onChange,
  onSave,
  saving,
  message,
}: Props) {
  let preview = '';
  try {
    if (settings.searchEngine === 'custom' && settings.customSearchUrl)
      preview = buildSearchUrl('take off', settings);
  } catch {
    /* Validate on save. */
  }
  return (
    <section className="settings content" aria-labelledby="settings-title">
      <h1 id="settings-title">Settings</h1>
      <fieldset>
        <legend>Appearance</legend>
        <label htmlFor="appearance">Theme</label>
        <CompactSelect
          id="appearance"
          name="appearance"
          value={settings.appearance}
          onChange={(value) =>
            onChange({
              ...settings,
              appearance: value as Settings['appearance'],
            })
          }
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </fieldset>
      <fieldset>
        <legend>Triggers</legend>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.shortcutEnabled}
            onChange={(event) =>
              onChange({ ...settings, shortcutEnabled: event.target.checked })
            }
          />
          <span>Keyboard shortcut</span>
        </label>
        <label htmlFor="shortcut" className="sr-only">
          Lookup shortcut
        </label>
        <ShortcutInput
          value={settings.shortcut}
          onChange={(shortcut) => onChange({ ...settings, shortcut })}
          disabled={!settings.shortcutEnabled}
        />
        <p className="hint" id="shortcut-hint">
          Click the box, then press your key combination.
        </p>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.autoPopupEnabled}
            onChange={(event) =>
              onChange({ ...settings, autoPopupEnabled: event.target.checked })
            }
          />
          <span>Auto popup on text selection</span>
        </label>
        <p className="hint">
          Enable either or both. Automatic cards appear without taking focus.
          Click to interact; drag the header to reposition.
        </p>
      </fieldset>
      <fieldset>
        <legend>Word details</legend>
        <div className="detail-options">
          {details.map(([key, label]) => (
            <label className="checkbox-label" key={key}>
              <input
                type="checkbox"
                checked={settings.details[key]}
                onChange={(event) =>
                  onChange({
                    ...settings,
                    details: {
                      ...settings.details,
                      [key]: event.target.checked,
                    },
                  })
                }
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <p className="hint">
          Missing content is identified on the card. Related words may apply to
          the whole part of speech.
        </p>
      </fieldset>
      <fieldset>
        <legend>Search</legend>
        <label htmlFor="search-engine">Search engine</label>
        <CompactSelect
          id="search-engine"
          name="searchEngine"
          value={settings.searchEngine}
          onChange={(value) =>
            onChange({ ...settings, searchEngine: value as SearchEngineId })
          }
          options={[
            ...SEARCH_ENGINES.map((engine) => ({
              value: engine.id,
              label: engine.label,
            })),
            { value: 'custom', label: 'Custom URL…' },
          ]}
        />
        {settings.searchEngine === 'custom' ? (
          <>
            <label htmlFor="custom-search-url">Custom search URL</label>
            <input
              id="custom-search-url"
              name="customSearchUrl"
              type="url"
              value={settings.customSearchUrl}
              onChange={(event) =>
                onChange({ ...settings, customSearchUrl: event.target.value })
              }
              placeholder="https://example.com/search?q={query}"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="hint">
              Use HTTPS and one <code>{'{query}'}</code> for the encoded word.
            </p>
            {preview ? (
              <p className="url-preview">
                <span>Preview for “take off”</span>
                <code>{preview}</code>
              </p>
            ) : null}
          </>
        ) : (
          <p className="hint">
            Searches for the word + “meaning” in your default browser.
          </p>
        )}
      </fieldset>
      <button className="primary-button" disabled={saving} onClick={onSave}>
        <Check size={15} aria-hidden="true" />
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
      <p role="status" className="settings-status">
        {message}
      </p>
      <p className="privacy-note">
        Only looked-up words go to the dictionary. No clipboard access, history,
        or analytics. Broken recordings can use a labeled system voice.
      </p>
    </section>
  );
}
