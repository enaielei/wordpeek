# Search settings

The external-search button uses the saved engine: Google, Bing, DuckDuckGo,
Brave Search, Ecosia, or Custom URL. Presets search for the selected word/phrase
followed by “meaning”. The button's accessible name and tooltip identify the
chosen destination. Editing a setting does not change the destination until Save.

## Custom URL

Use an HTTPS address with exactly one literal `{query}` in its path or query string:

```text
https://example.com/search?q={query}
https://example.com/define/{query}?lang=en
```

WordPeek substitutes the normalized selected word/phrase, encoded once as a URL
component. For `take off`, the second example becomes:

```text
https://example.com/define/take%20off?lang=en
```

Custom URLs receive the word itself; WordPeek does not append “meaning”. Include
any extra search text directly in the template, for example `q={query}%20meaning`.
Other path components and parameters are retained. A preview uses the demonstration
phrase “take off” without making any request.

The template must be no longer than 2,048 characters, cannot contain credentials,
and cannot put the placeholder in the host, scheme, or fragment. Non-HTTPS schemes,
missing/duplicate placeholders, and unknown template variables are rejected. A
dictionary entry cannot supply or change this destination.

## Tray shortcuts

Right-click the WordPeek tray icon to open the dictionary, look up the clipboard,
open Settings, pick a search engine, toggle clipboard fallback, or quit. Quick
changes save immediately and update an open settings panel. Custom URL is selectable
from the tray only after a valid template is saved in Settings.

Settings are validated in the main process, written atomically, and serialized so
simultaneous tray/panel updates do not race. Older preference files keep their
shortcut and clipboard choice and gain Google as their initial search engine.
Invalid saved search configuration falls back to Google; invalid new saves show
an error and leave the existing configuration intact.

No page is opened when you save or switch an engine. Only an explicit search
action opens the configured destination in your default browser.

## Appearance and shortcut chips

Settings and the tray support System, Light, and Dark appearance. The saved
choice updates both native Electron surfaces and the HTML card and persists
after restart. System follows the operating system. Shortcut chips show the
configured keys while the text field remains editable.
