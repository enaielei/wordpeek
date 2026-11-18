import { CompactSelect } from './components/CompactSelect';
import { ShortcutKeys } from './components/ShortcutKeys';
import { Check } from 'lucide-react';
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

export function SettingsPanel({
  settings,
  onChange,
  onSave,
  saving,
  message,
}: Props) {
  let preview = '';
  if (settings.searchEngine === 'custom' && settings.customSearchUrl) {
    try {
      preview = buildSearchUrl('take off', settings);
    } catch {
      /* Validate on Save, not while the user is typing. */
    }
  }
  return (
    <section className="settings content" aria-labelledby="settings-title">
      <h1 id="settings-title">Settings</h1>
      <label htmlFor="appearance">Appearance</label>
      <CompactSelect
        id="appearance"
        name="appearance"
        value={settings.appearance}
        onChange={(value) =>
          onChange({ ...settings, appearance: value as Settings['appearance'] })
        }
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />
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
            aria-describedby="custom-url-hint"
          />
          <p id="custom-url-hint" className="hint">
            Use HTTPS and one <code>{'{query}'}</code>. We replace it with the
            encoded word or phrase.
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
          Opens in your default browser. Presets search for the word +
          “meaning”.
        </p>
      )}
      <label htmlFor="shortcut">Lookup shortcut</label>
      <input
        id="shortcut"
        name="shortcut"
        value={settings.shortcut}
        onChange={(event) =>
          onChange({ ...settings, shortcut: event.target.value })
        }
        autoComplete="off"
        spellCheck={false}
      />
      <div className="shortcut-preview">
        <ShortcutKeys shortcut={settings.shortcut} />
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={settings.clipboardFallback}
          onChange={(event) =>
            onChange({ ...settings, clipboardFallback: event.target.checked })
          }
        />
        <span>Use clipboard if selection is unavailable</span>
      </label>
      <p className="hint">
        Off by default. If enabled, the shortcut may look up a previously copied
        word. No clipboard monitoring.
      </p>
      <button className="primary-button" disabled={saving} onClick={onSave}>
        <Check size={15} aria-hidden="true" />
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
      <p role="status" className="settings-status">
        {message}
      </p>
      <p className="privacy-note">
        Words go to the online dictionary. Search sends the word to your chosen
        website only when you press the search button. No history or analytics.
      </p>
    </section>
  );
}
