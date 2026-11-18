# WordPeek brand guidelines

Version 1.0 · 2026-11-18 · Applies to the app, repository, screenshots, and future website.

## Purpose and voice

**A little clarity, right where you read.**

WordPeek is a small reading companion for people learning English. It should feel
calm, capable, warm, and unobtrusive. The content is the focus. Keep the surrounding
interface quieter than the word and definition.

Use plain English, sentence case in prose, and short action labels. Say “No entry
found. Try the base word or search Google.” rather than “Error 404” or “Oops!”.
Never shame a learner, use unexplained linguistic jargon, or imply every synonym
is interchangeable. Use “Similar” and “Opposite” for compact relationship labels.

Name: **WordPeek**, capital W and P, one word. Descriptor: **Online desktop dictionary**.
Tagline is optional and never occupies space in a populated word card.

## Logo system

The mark is an open book containing a W: two pages, two weights of the same color,
and a small negative-space W. It refers to a quick peek into a word's meaning.
Canonical vectors are assets/brand/mark.svg and assets/brand/app-icon.svg.

- The mark uses currentColor; use teal on light backgrounds and mint on dark.
- App icon: paper pages on a teal rounded square. Use the icon container only for
  app/system surfaces, not every button or repeated UI decoration.
- Wordmark: mark + WordPeek, UI font at weight 650, tracking −0.03em. Do not outline
  or replace letterforms with an unrelated display font.
- Clear space: at least one quarter of the mark's width on every side.
- Minimum mark size: 24 CSS px in app content; 16 px only for favicons/tray use.
- Minimum wordmark size: 16 CSS px text with a 28 px mark.
- Never stretch, rotate, add gradients, shadows to the mark, or use a multicolor W.
- Keep the logo out of pronunciation, Google, and pagination controls.

PNG app icons are generated from the canonical SVG with npm run brand:icons.
Do not edit raster exports manually. Original logo assets use the app's MIT license.

## Color

Canonical implementation: src/brand/tokens.css. Semantic tokens, not arbitrary
hex values, must be used in component CSS. Theme changes require updating this
guide and reviewing light/dark contrast.

| Role        | Light   | Dark    | Use                           |
| ----------- | ------- | ------- | ----------------------------- |
| Paper       | #F7F6F2 | #172320 | Main canvas                   |
| Surface     | #FFFFFF | #202F2A | Inputs and source panel       |
| Ink         | #202E2B | #EDF1E9 | Word and definition           |
| Muted       | #626D68 | #ADB9B0 | Metadata and examples         |
| Accent      | #166B60 | #91D2BF | Pronunciation, focus, brand   |
| Accent soft | #E4EFEA | #273E35 | Restrained control background |
| Line        | #DCDED6 | #42534A | Decorative separators         |
| Danger      | #9C3931 | #FFB4A8 | Actionable error text         |

Ink, muted text, accent text, and danger text must meet WCAG AA normal-text
contrast against their intended surfaces. Lines are decorative, not the sole
indicator of a control or state. Never use color alone to convey meaning.

## Typography

- Interface: Segoe UI Variable → Segoe UI → system-ui → sans-serif. No font CDN.
- Headword: Iowan Old Style → Palatino Linotype → Book Antiqua → Georgia → serif.
- Headword: 34 px / 1.15, weight 500, tracking −1 px. Wrap long words.
- Definition: 17 px / 1.6, normal weight. This is the visual priority after the word.
- Example: 14 px / 1.65, muted, with a 2 px accent rule. Avoid decorative italics.
- Metadata and related words: 13 px. Footer: 11–12 px. Never shrink content to fit.
- Use tabular numbers for 1 / 3. IPA may use the UI font's Unicode fallback.
- Keep text selectable and test Windows text scaling. Scroll for long entries.

## Layout and content budget

Window width: 416 CSS px. Height fits the content, from 280 to 640 px
(device-independent desktop coordinates), with scrolling for long entries.
It is a utility window, not a dashboard. Spacing uses a 4 px base scale:
4, 8, 12, 16, 20, 24, 32. Content inset: 24 px. Control corners: 8 px.
Card radius for web/marketing previews: 16 px. The first Windows prototype uses
a rectangular native window; do not imply a rounded transparent native window exists.

Information order:

1. Small app header with settings and dismiss controls.
2. Quiet lookup input, always available as a fallback.
3. Headword; pronunciation and Google icon buttons.
4. Part of speech and phonetic text.
5. One meaning and one example if supplied.
6. Up to three sense-specific synonyms and antonyms when supplied.
7. Source/license disclosure and previous/next meanings.

Do not add etymology, translations, AI explanations, ads, daily words, streaks,
large tab bars, or promotional copy to the core card. Future additions need an
explicit product decision. Missing fields disappear; no empty headings.

## Icons and interactions

Use **Lucide**, one consistent outline family. Canonical icons: Volume2,
ArrowUpRight, ChevronLeft, ChevronRight, Settings2, X, Search, ArrowLeft, Check.
Icons: 18 px in 32 × 32 px targets, 1.75 stroke, round caps. Never use emoji icons.
All icon-only controls require an accessible name and a useful tooltip.

- Pronunciation is the only softly filled headword action. Disable it when no
  supported recording exists and explain that state in the label/tooltip.
- Google arrow means “Search Google”; it opens the default browser, never embeds
  search results inside WordPeek.
- Pagination: ‹ 1 / 3 ›; no wrapping. Disable the unavailable edge. Hide it for
  a single meaning. Update definition, example, and relations together.
- Escape dismisses; outside focus hides the native window. Keyboard arrows move
  meanings except while editing input. Tab reaches every action.
- Focus: 2 px accent outline, 3 px offset. Never remove it without replacement.
- Hover changes background/foreground; avoid scale/bounce effects.
- Loading uses one small pulse and a short status. Honor reduced motion.
- Error states explain the next step and offer retry/Google where appropriate.
- No automatic audio, automatic external navigation, or blocking alerts.

## Approval criteria for visible changes

Before merging UI work, verify at 100% and 200% zoom, light and dark themes,
keyboard-only interaction, missing example/relations/audio, multiple senses,
long words/definitions, loading, network failure, and no-result states. Screenshots
must identify whether they use live data or demonstration fixtures. See docs/testing.md.

The visual board at docs/brand/index.html is a reference, not an alternative token source.
