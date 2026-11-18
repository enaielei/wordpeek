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
  Check,
} from 'lucide-react';
import { bridge } from './bridge';
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
  const [searched, setSearched] = useState('');
  const [senses, setSenses] = useState<Sense[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    shortcut: 'Control+Alt+W',
    clipboardFallback: false,
  });
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
    settingsMessage,
  ]);

  const lookup = useCallback(async (value: string) => {
    const word = value.trim().replace(/\s+/gu, ' ');
    const id = ++request.current;
    setQuery(word);
    setSearched(word);
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
            'This entry has no readable meanings. Try another word or search Google.',
          );
      }
    } catch {
      if (mounted.current && id === request.current)
        setMessage('Couldn’t load the word. Try again or search Google.');
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
      input.current?.focus();
    };
    const unsubscribe = bridge.onSelection(receive);
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
        if (mounted.current) setSettings(value);
      })
      .catch(() => undefined);
    return () => {
      mounted.current = false;
      unsubscribe();
      audio.current?.pause();
    };
  }, [lookup]);

  useEffect(() => {
    audio.current?.pause();
    audio.current = null;
  }, [page, searched]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
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
        setPage((value) => Math.max(0, value - 1));
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setPage((value) => Math.min(senses.length - 1, value + 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen, sourceOpen, senses.length]);

  async function google() {
    try {
      await bridge.google(searched || query);
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
    if (!sense?.audio) return;
    audio.current?.pause();
    const player = new Audio(sense.audio);
    audio.current = player;
    try {
      await player.play();
    } catch {
      setActionMessage(
        'Pronunciation couldn’t play. Try again or search Google.',
      );
    }
  }
  async function save() {
    setSaving(true);
    try {
      const result = await bridge.saveSettings(settings);
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
    <main ref={popover} className="popover" aria-label="WordPeek dictionary">
      <header className="app-header">
        <div className="brand">
          <Mark />
          <span translate="no">WordPeek</span>
        </div>
        <div className="header-actions">
          <button
            className="icon-button"
            aria-label={settingsOpen ? 'Back to dictionary' : 'Open settings'}
            title={settingsOpen ? 'Back to dictionary' : 'Settings'}
            onClick={() => {
              setSettingsOpen(!settingsOpen);
              setSettingsMessage('');
            }}
          >
            {settingsOpen ? (
              <ArrowLeft aria-hidden="true" />
            ) : (
              <Settings2 aria-hidden="true" />
            )}
          </button>
          <button
            className="icon-button"
            aria-label="Dismiss WordPeek"
            title="Dismiss (Esc)"
            onClick={() => void bridge.hide()}
          >
            <X aria-hidden="true" />
          </button>
        </div>
      </header>
      {settingsOpen ? (
        <section className="settings content">
          <p className="eyebrow">MAKE IT YOURS</p>
          <h1>Little preferences.</h1>
          <label htmlFor="shortcut">Lookup shortcut</label>
          <input
            id="shortcut"
            name="shortcut"
            value={settings.shortcut}
            onChange={(event) => {
              setSettings({ ...settings, shortcut: event.target.value });
              setSettingsMessage('');
            }}
            autoComplete="off"
            spellCheck={false}
          />
          <p className="hint">
            Use modifiers and a letter, like Control+Alt+W.
          </p>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.clipboardFallback}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  clipboardFallback: event.target.checked,
                })
              }
            />
            <span>Use clipboard if selection is unavailable</span>
          </label>
          <p className="hint">
            Off by default. When enabled, the shortcut may send a previously
            copied word to the online dictionary. WordPeek never monitors your
            clipboard.
          </p>
          <button
            className="primary-button"
            disabled={saving}
            onClick={() => void save()}
          >
            <Check size={16} aria-hidden="true" />
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          <p role="status" className="hint">
            {settingsMessage}
          </p>
          <p className="privacy-note">
            Lookups go to Free Dictionary API. Audio loads when you press play.
            Google and source links open in your default browser. No accounts,
            analytics, or saved lookup history.
          </p>
        </section>
      ) : (
        <>
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
            <button className="lookup-submit" type="submit" disabled={loading}>
              Look Up
            </button>
          </form>
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
                    <button
                      className="icon-button accent-button"
                      aria-label={
                        sense.audio
                          ? `Play pronunciation of ${sense.word}`
                          : 'Pronunciation unavailable'
                      }
                      title={
                        sense.audio
                          ? 'Play pronunciation'
                          : 'No recording available'
                      }
                      disabled={!sense.audio}
                      onClick={() => void speak()}
                    >
                      <Volume2 aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Search Google for ${searched}`}
                      title="Search Google"
                      onClick={() => void google()}
                    >
                      <ArrowUpRight aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <p className="word-meta">
                  <span>{sense.partOfSpeech}</span>
                  {sense.phonetic ? (
                    <>
                      <span className="meta-dot" aria-hidden="true">
                        ·
                      </span>
                      <span>{sense.phonetic}</span>
                    </>
                  ) : null}
                </p>
                <div className="sense-body" key={sense.id}>
                  <p className="definition">{sense.definition}</p>
                  {sense.example ? (
                    <blockquote>{sense.example}</blockquote>
                  ) : null}
                  {sense.synonyms.length || sense.antonyms.length ? (
                    <dl className="relations">
                      {sense.synonyms.length ? (
                        <div>
                          <dt>Similar</dt>
                          <dd>{sense.synonyms.slice(0, 3).join(', ')}</dd>
                        </div>
                      ) : null}
                      {sense.antonyms.length ? (
                        <div>
                          <dt>Opposite</dt>
                          <dd>{sense.antonyms.slice(0, 3).join(', ')}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <span className="empty-mark">
                  <Mark />
                </span>
                <p className="eyebrow">A LITTLE CLARITY</p>
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
                      onClick={() => void google()}
                    >
                      Search Google{' '}
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
                <button
                  className="icon-button"
                  aria-label="Previous meaning"
                  title="Previous meaning (←)"
                  disabled={page === 0}
                  onClick={() => {
                    setPage(page - 1);
                    setSourceOpen(false);
                  }}
                >
                  <ChevronLeft aria-hidden="true" />
                </button>
                <span aria-live="polite">
                  {page + 1} <span className="page-divider">/</span>{' '}
                  {senses.length}
                </span>
                <button
                  className="icon-button"
                  aria-label="Next meaning"
                  title="Next meaning (→)"
                  disabled={page === senses.length - 1}
                  onClick={() => {
                    setPage(page + 1);
                    setSourceOpen(false);
                  }}
                >
                  <ChevronRight aria-hidden="true" />
                </button>
              </nav>
            ) : (
              <span className="escape-hint">esc to close</span>
            )}
          </footer>
          {sourceOpen && sense ? (
            <aside className="source-panel" aria-label="Dictionary attribution">
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
                    {allowedUrl(sense.license.url, ['creativecommons.org']) ? (
                      <button onClick={() => void source(sense.license!.url)}>
                        {sense.license.name}
                      </button>
                    ) : (
                      sense.license.name
                    )}
                    . Display shortened to one meaning at a time; related lists
                    limited to 3.
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
  );
}
