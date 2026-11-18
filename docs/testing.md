# Verification

## Automated gates

`npm run check` runs formatting, linting, meaningful unit/component tests, strict
TypeScript, and a production frontend build. Tests use deterministic, clearly marked
fixtures; live dictionary uptime must not decide whether PR CI passes.

Provider tests cover invalid input, URL validation, 404/429/server failures,
timeout/network errors, response bounds, and source data preservation. UI tests cover
sense navigation, hidden empty fields, error recovery, and configured web-search handoff. Do not
add implementation-mirroring tests or arbitrary global coverage thresholds.

The Windows build job creates an unsigned unpacked app. A manual installer workflow
produces an NSIS artifact; release publication remains a maintainer action.

## Recorded initial verification (2026-11-18)

- Windows source app and packaged executable: live bright lookup, meaning navigation, source/license
  disclosure, settings display, clipboard fallback default, and Escape hiding passed.
- Renderer reported no page errors. Light/dark screenshots and a full brand board
  were rendered and inspected.
- npm run check: 18 tests, formatting, linting, types, and production build passed.
- npm run package:win: unsigned NSIS installer built successfully.
- npm run audit:runtime: zero reported runtime advisories. Development-tool audit
  findings are tracked in [issue #2](https://github.com/enaielei/wordpeek/issues/2).
- Cross-app selection, shortcut conflict/persistence, mixed-DPI behavior, Google
  opening, and audio playback have not yet been manually verified. See
  [issue #3](https://github.com/enaielei/wordpeek/issues/3).

Run npm run test:desktop for the live desktop smoke test. It requires Windows,
an interactive session, and the public dictionary service, so it is intentionally
separate from deterministic PR tests. WORDPEEK_ARTIFACTS changes the screenshot
output directory. WORDPEEK_EXECUTABLE optionally tests a packaged executable.

## Native acceptance checklist

Record actual app and OS versions, pass/fail, and limitations in the PR. Do not
mark unperformed checks as passed.

- App starts; tray remains available after hiding; Quit fully exits.
- Select a word in Edge/Chrome, Notepad, Word, and a PDF reader; invoke the hotkey.
  Record support per application. Unsupported selection must open a useful fallback.
- No selected text: manual entry works. Clipboard remains untouched.
- Clipboard fallback is off by default. Explicit tray lookup and opt-in fallback
  send only short validated text, never a copied document.
- Shortcut can be changed and persists after restart. A conflict produces an error.
- Popup is on-screen near the cursor on primary/secondary displays at different DPI.
- Escape and clicking another app hide the popover; pagination remains usable.
- Selected search presets and custom URLs open with the correct encoded query; source links work.
- Tray opens Settings and updates engine/clipboard preferences. Panel, tray, and
  saved configuration agree after changes and restart. Invalid templates do not save.
- Audio only loads after playback; recording failure has a useful message.
- Unavailable internet, a missing word, and a provider failure show retry/search.
- Keyboard-only use, light/dark, 100%/200% zoom, long words/content, missing fields,
  and reduced motion remain readable and navigable.

## Brand verification

Use docs/brand/index.html for the visual reference and src/brand/tokens.css for
canonical values. Validate normal-text contrast with the actual semantic color
pairs; visual screenshots alone do not establish accessibility compliance.

## Approved 0.2.0 design verification

- Brand contrast checks cover small primary/secondary text on actual light/dark
  surfaces; orange text is reserved for backgrounds where contrast meets AA.
- Quality suite: 52 tests, formatting, lint, strict types, and production build.
- Isolated desktop tests cover legacy migration, actual Radix settings controls,
  shortcut chips, menu Escape behavior, appearance saving, tray synchronization,
  custom search encoding, invalid-save rejection, and restart persistence.
- Live dictionary smoke covers meaning navigation, source attribution, compact
  window sizing, light/dark screenshots, and Escape dismissal.
- Runtime dependency audit remains clean; build-tool advisories remain in #2.
- Source-app tests use separate profiles/hotkeys and intercept external searches.
  The user's installed running instance is not stopped or reconfigured.
