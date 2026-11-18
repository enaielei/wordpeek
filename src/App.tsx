import * as Tooltip from '@radix-ui/react-tooltip';
import { IconButton } from './components/IconButton';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Settings2,
  Volume2,
  X,
  ArrowLeft,
} from 'lucide-react';
import { bridge } from './bridge';
import {
  DEFAULT_SEARCH_SETTINGS,
  searchLabel,
  validateSearchSettings,
} from '../shared/search.mjs';
import { SettingsPanel } from './SettingsPanel';
import { allowedUrl, toSenses } from './dictionary';
import type { SelectionContext, Sense, Settings } from './types';

function Mark() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="brand-mark"
    >
      <path d="M8 12v23l16 5V17L8 12Z" fill="currentColor" />
      <path d="M24 17v23l16-5V12l-16 5Z" fill="currentColor" opacity=".65" />
      <path
        d="m15 22 4 13 5-10 5 10 4-13"
        stroke="var(--wp-paper)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function App() {
  const [query, setQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searched, setSearched] = useState('');
  const [senses, setSenses] = useState<Sense[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [audioNotice, setAudioNotice] = useState('');
  const playback = useRef(0);
  const [actionMessage, setActionMessage] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    appearance: 'system',
    shortcut: 'Control+Alt+W',
    shortcutEnabled: true,
    autoPopupEnabled: false,
    details: {
      definition: true,
      partOfSpeech: true,
      phonetic: true,
      pronunciation: true,
      example: true,
      synonyms: true,
      antonyms: true,
    },
    ...DEFAULT_SEARCH_SETTINGS,
  });
  const [preferences, setPreferences] = useState<Settings>({
    appearance: 'system',
    shortcut: 'Control+Alt+W',
    shortcutEnabled: true,
    autoPopupEnabled: false,
    details: {
      definition: true,
      partOfSpeech: true,
      phonetic: true,
      pronunciation: true,
      example: true,
      synonyms: true,
      antonyms: true,
    },
    ...DEFAULT_SEARCH_SETTINGS,
  });
  useEffect(() => {
    document.documentElement.dataset.appearance = preferences.appearance;
  }, [preferences.appearance]);
  const searchAction =
    preferences.searchEngine === 'custom'
      ? 'Search custom URL'
      : `Search ${searchLabel(preferences)}`;
  const [saving, setSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [sourceOpen, setSourceOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const mounted = useRef(true);
  const audio = useRef<HTMLAudioElement | null>(null);
  const sense = senses[page];
  const popover = useRef<HTMLElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const height = popover.current?.scrollHeight;
      if (height) void bridge.resize(height).catch(() => undefined);
    });
    return () => cancelAnimationFrame(frame);
  }, [
    sense,
    loading,
    message,
    settingsOpen,
    sourceOpen,
    actionMessage,
    audioNotice,
    settingsMessage,
    searchVisible,
    settings.searchEngine,
    settings.customSearchUrl,
    preferences.details,
  ]);

  const lookup = useCallback(async (value: string) => {
    const word = value.trim().replace(/\s+/gu, ' ');
    const id = ++request.current;
    setQuery(word);
    setSearched(word);
    setAudioNotice('');
    setSearchVisible(false);
    setActionMessage('');
    setSourceOpen(false);
    setSenses([]);
    setPage(0);
    if (!word || word.length > 80 || !/^[\p{L}\p{M} '\u2019-]+$/u.test(word)) {
      setLoading(false);
      setMessage('Enter an English word or short phrase, up to 80 characters.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const result = await bridge.lookup(word);
      if (!mounted.current || id !== request.current) return;
      if (!result.ok) setMessage(result.error.message);
      else {
        const next = toSenses(result.entries);
        setSenses(next);
        if (!next.length)
          setMessage(
            'This entry has no readable meanings. Try another word or search the web.',
          );
      }
    } catch {
      if (mounted.current && id === request.current)
        setMessage('Couldn’t load the word. Try again or search the web.');
    } finally {
      if (mounted.current && id === request.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let revision = -1;
    const receive = (context: SelectionContext) => {
      if (!mounted.current || context.revision <= revision) return;
      revision = context.revision;
      setSettingsOpen(false);
      setActionMessage('');
      if (context.word) void lookup(context.word);
      else {
        request.current++;
        setLoading(false);
        setMessage(context.message);
        setQuery('');
        setSearched('');
        setSenses([]);
      }
      if (!context.passive) input.current?.focus();
    };
    const unsubscribe = bridge.onSelection(receive);
    const unsubscribeSettings = bridge.onSettingsChanged((value) => {
      if (!mounted.current) return;
      setSettings(value);
      setPreferences(value);
    });
    const unsubscribeOpen = bridge.onOpenSettings((payload) => {
      if (!mounted.current) return;
      setSettingsOpen(true);
      setSettingsMessage(payload.message || '');
    });
    void bridge
      .context()
      .then(receive)
      .catch(() => {
        if (mounted.current)
          setMessage('Couldn’t read the selection. Type a word here.');
      });
    void bridge
      .settings()
      .then((value) => {
        if (mounted.current) {
          setSettings(value);
          setPreferences(value);
        }
      })
      .catch(() => undefined);
    return () => {
      mounted.current = false;
      unsubscribe();
      unsubscribeSettings();
      unsubscribeOpen();
      audio.current?.pause();
    };
  }, [lookup]);

  useEffect(() => {
    playback.current++;
    audio.current?.pause();
    audio.current = null;
  }, [page, searched]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        document.querySelector('[data-wordpeek-select-open]')
      )
        return;
      if (event.key === 'Escape') {
        if (settingsOpen) setSettingsOpen(false);
        else if (sourceOpen) setSourceOpen(false);
        else void bridge.hide();
      }
      if (
        event.target instanceof HTMLInputElement ||
        settingsOpen ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setAudioNotice('');
        setPage((value) => Math.max(0, value - 1));
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setAudioNotice('');
        setPage((value) => Math.min(senses.length - 1, value + 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen, sourceOpen, senses.length]);

  async function searchWeb() {
    try {
      await bridge.search(searched || query);
    } catch {
      setActionMessage('Couldn’t open your browser. Try again.');
    }
  }
  async function source(url: string) {
    try {
      await bridge.source(url);
    } catch {
      setActionMessage('Couldn’t open this source in your browser.');
    }
  }
  async function speak() {
    if (!sense) return;
    const id = ++playback.current;
    setAudioNotice('');
    audio.current?.pause();
    for (const url of sense.recordings?.length
      ? sense.recordings
      : sense.audio
        ? [sense.audio]
        : []) {
      const player = new Audio(url);
      audio.current = player;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          player.play(),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(
              () => reject(new Error('Audio timeout')),
              3500,
            );
          }),
        ]);
        clearTimeout(timeout);
        if (id === playback.current) return;
        player.pause();
        return;
      } catch {
        clearTimeout(timeout);
        player.pause();
        if (id !== playback.current) return;
      }
    }
    try {
      const result = await bridge.speak(sense.word);
      if (id === playback.current)
        setAudioNotice(
          result.ok
            ? 'Using the system voice; no working recording was provided.'
            : 'No working recording or system voice is available.',
        );
    } catch {
      if (id === playback.current)
        setAudioNotice('No working recording or system voice is available.');
    }
  }
  async function save() {
    try {
      validateSearchSettings(settings);
    } catch (error) {
      setSettingsMessage(
        error instanceof Error ? error.message : 'Check the search settings.',
      );
      document.getElementById('custom-search-url')?.focus();
      return;
    }
    setSaving(true);
    try {
      const result = await bridge.saveSettings(settings);
      if (result.ok) {
        const saved = result.settings ?? settings;
        setSettings(saved);
        setPreferences(saved);
      }
      setSettingsMessage(
        result.ok
          ? 'Settings saved.'
          : result.message || 'Couldn’t save settings.',
      );
    } catch {
      setSettingsMessage('Settings are available in the desktop app.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Tooltip.Provider delayDuration={400}>
      <main ref={popover} className="popover" aria-label="WordPeek dictionary">
        <header className="app-header">
          <div className="brand">
            <Mark />
            <span translate="no">WordPeek</span>
          </div>
          <div className="header-actions">
            {!settingsOpen && sense ? (
              <IconButton
                className="icon-button"
                aria-label="Look up another word"
                title="Look up another word"
                onClick={() => {
                  setSearchVisible(!searchVisible);
                  requestAnimationFrame(() => input.current?.focus());
                }}
              >
                <Search aria-hidden="true" />
              </IconButton>
            ) : null}
            <IconButton
              className="icon-button"
              aria-label={settingsOpen ? 'Back to dictionary' : 'Open settings'}
              title={settingsOpen ? 'Back to dictionary' : 'Settings'}
              onClick={() => {
                setSettings(preferences);
                setSettingsOpen(!settingsOpen);
                setSettingsMessage('');
              }}
            >
              {settingsOpen ? (
                <ArrowLeft aria-hidden="true" />
              ) : (
                <Settings2 aria-hidden="true" />
              )}
            </IconButton>
            <IconButton
              className="icon-button"
              aria-label="Dismiss WordPeek"
              title="Dismiss (Esc)"
              onClick={() => void bridge.hide()}
            >
              <X aria-hidden="true" />
            </IconButton>
          </div>
        </header>
        {settingsOpen ? (
          <SettingsPanel
            settings={settings}
            onChange={(next) => {
              setSettings(next);
              setSettingsMessage('');
            }}
            onSave={() => void save()}
            saving={saving}
            message={settingsMessage}
          />
        ) : (
          <>
            {!sense || searchVisible ? (
              <form
                className="lookup-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void lookup(query);
                }}
              >
                <Search size={16} aria-hidden="true" />
                <label className="sr-only" htmlFor="word">
                  Word or short phrase
                </label>
                <input
                  ref={input}
                  id="word"
                  name="word"
                  placeholder="A word you’re curious about…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  maxLength={80}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  className="lookup-submit"
                  type="submit"
                  disabled={loading}
                >
                  Look Up
                </button>
              </form>
            ) : null}
            <section className="content dictionary-content" aria-busy={loading}>
              {loading ? (
                <div className="empty-state" role="status">
                  <span className="loading-dot" />
                  <p>Finding a little clarity…</p>
                </div>
              ) : sense ? (
                <>
                  <div className="word-heading">
                    <h1>{sense.word}</h1>
                    <div className="word-actions">
                      {preferences.details.pronunciation ? (
                        <IconButton
                          className="icon-button accent-button"
                          aria-label={`Play pronunciation of ${sense.word}`}
                          title="Play pronunciation (system voice if recording fails)"
                          onClick={() => void speak()}
                        >
                          <Volume2 aria-hidden="true" />
                        </IconButton>
                      ) : null}
                      <IconButton
                        className="icon-button"
                        aria-label={`${searchAction} for ${searched}`}
                        title={searchAction}
                        onClick={() => void searchWeb()}
                      >
                        <ArrowUpRight aria-hidden="true" />
                      </IconButton>
                    </div>
                  </div>
                  <p className="word-meta">
                    {preferences.details.partOfSpeech ? (
                      <span>{sense.partOfSpeech}</span>
                    ) : null}
                    {preferences.details.phonetic && sense.phonetic ? (
                      <>
                        {preferences.details.partOfSpeech ? (
                          <span className="meta-dot" aria-hidden="true">
                            ·
                          </span>
                        ) : null}
                        <span>{sense.phonetic}</span>
                      </>
                    ) : null}
                  </p>
                  <div className="sense-body" key={sense.id}>
                    {preferences.details.definition ? (
                      <p className="definition">{sense.definition}</p>
                    ) : null}
                    {preferences.details.example && sense.example ? (
                      <blockquote>{sense.example}</blockquote>
                    ) : null}
                    {(preferences.details.synonyms && sense.synonyms.length) ||
                    (preferences.details.antonyms && sense.antonyms.length) ? (
                      <dl className="relations">
                        {preferences.details.synonyms &&
                        sense.synonyms.length ? (
                          <div>
                            <dt>Similar</dt>
                            <dd>{sense.synonyms.slice(0, 3).join(', ')}</dd>
                          </div>
                        ) : null}
                        {preferences.details.antonyms &&
                        sense.antonyms.length ? (
                          <div>
                            <dt>Opposite</dt>
                            <dd>{sense.antonyms.slice(0, 3).join(', ')}</dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : null}
                    {(preferences.details.synonyms &&
                      sense.synonyms.length &&
                      sense.synonymsScope === 'partOfSpeech') ||
                    (preferences.details.antonyms &&
                      sense.antonyms.length &&
                      sense.antonymsScope === 'partOfSpeech') ? (
                      <p className="provider-note">
                        Related words apply to {sense.partOfSpeech} usage, not
                        just this meaning.
                      </p>
                    ) : null}
                    {(() => {
                      const missing = [
                        preferences.details.example && !sense.example
                          ? 'example'
                          : '',
                        preferences.details.synonyms && !sense.synonyms.length
                          ? 'synonyms'
                          : '',
                        preferences.details.antonyms && !sense.antonyms.length
                          ? 'antonyms'
                          : '',
                        preferences.details.phonetic && !sense.phonetic
                          ? 'phonetic spelling'
                          : '',
                      ].filter(Boolean);
                      return missing.length ? (
                        <p className="provider-note">
                          Not provided: {missing.join(', ')}.
                        </p>
                      ) : null;
                    })()}
                  </div>
                  <p className="audio-notice" role="status">
                    {audioNotice}
                  </p>
                </>
              ) : (
                <div className="empty-state">
                  <h1>
                    {message ? 'Let’s try another way.' : 'Keep your place.'}
                  </h1>
                  <p role="status">
                    {message ||
                      `Select a word and press ${settings.shortcut.replaceAll('Control', 'Ctrl')}. Or look one up here.`}
                  </p>
                  {searched ? (
                    <div className="empty-actions">
                      <button
                        className="text-button"
                        onClick={() => void lookup(searched)}
                      >
                        Try Again
                      </button>
                      <button
                        className="text-button"
                        onClick={() => void searchWeb()}
                      >
                        {searchAction}{' '}
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
              <p className="action-message" role="status">
                {actionMessage}
              </p>
            </section>
            <footer className="card-footer">
              <div className="attribution">
                {sense ? (
                  <button
                    className="source-button"
                    onClick={() => setSourceOpen(!sourceOpen)}
                    aria-expanded={sourceOpen}
                  >
                    Source & License
                  </button>
                ) : (
                  <span>Online English dictionary</span>
                )}
              </div>
              {senses.length > 1 ? (
                <nav className="meaning-nav" aria-label="Meanings">
                  <IconButton
                    className="icon-button"
                    aria-label="Previous meaning"
                    title="Previous meaning (←)"
                    disabled={page === 0}
                    onClick={() => {
                      setAudioNotice('');
                      setPage(page - 1);
                      setSourceOpen(false);
                    }}
                  >
                    <ChevronLeft aria-hidden="true" />
                  </IconButton>
                  <span aria-live="polite">
                    {page + 1} <span className="page-divider">/</span>{' '}
                    {senses.length}
                  </span>
                  <IconButton
                    className="icon-button"
                    aria-label="Next meaning"
                    title="Next meaning (→)"
                    disabled={page === senses.length - 1}
                    onClick={() => {
                      setAudioNotice('');
                      setPage(page + 1);
                      setSourceOpen(false);
                    }}
                  >
                    <ChevronRight aria-hidden="true" />
                  </IconButton>
                </nav>
              ) : (
                <span className="escape-hint">esc to close</span>
              )}
            </footer>
            {sourceOpen && sense ? (
              <aside
                className="source-panel"
                aria-label="Dictionary attribution"
              >
                <p>
                  Content via Free Dictionary API.{' '}
                  {sense.source ? (
                    <button onClick={() => void source(sense.source!)}>
                      View Wiktionary entry{' '}
                      <ArrowUpRight size={12} aria-hidden="true" />
                    </button>
                  ) : (
                    'Original entry source unavailable.'
                  )}
                </p>
                <p>
                  {sense.license?.name ? (
                    <>
                      Text:{' '}
                      {allowedUrl(sense.license.url, [
                        'creativecommons.org',
                      ]) ? (
                        <button onClick={() => void source(sense.license!.url)}>
                          {sense.license.name}
                        </button>
                      ) : (
                        sense.license.name
                      )}
                      . Display shortened to one meaning at a time; related
                      lists limited to 3.
                    </>
                  ) : (
                    'Text license was not supplied by the provider.'
                  )}
                </p>
                {sense.audio ? (
                  <p>
                    Audio: {sense.audioLicense?.name || 'license not supplied'}.
                    {sense.audioSource ? (
                      <>
                        {' '}
                        <button onClick={() => void source(sense.audioSource!)}>
                          Recording source
                        </button>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </aside>
            ) : null}
          </>
        )}
      </main>
    </Tooltip.Provider>
  );
}
