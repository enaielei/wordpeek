# WordPeek brand guidelines

Version 1.2 · 2026-11-18 · Applies to the app, repository, screenshots, and future website.

## Purpose and voice

**A little clarity, right where you read.**

WordPeek is a small reading companion for people learning English. It should feel
calm, capable, warm, and unobtrusive. The content is the focus. Keep the surrounding
interface quieter than the word and definition.

Use plain English, sentence case in prose, and short action labels. Say “No entry
found. Try the base word or search the web.” rather than “Error 404” or “Oops!”.
Never shame a learner, use unexplained linguistic jargon, or imply every synonym
is interchangeable. Use “Similar” and “Opposite” for compact relationship labels.

Name: **WordPeek**, capital W and P, one word. Descriptor: **Online desktop dictionary**.
Tagline is optional and never occupies space in a populated word card.

## Logo system

The mark is an open book containing a W: two pages, two weights of the same color,
and a small negative-space W. It refers to a quick peek into a word's meaning.
Canonical vectors are assets/brand/mark.svg and assets/brand/app-icon.svg.

- The mark uses currentColor; use tangerine on light backgrounds and soft orange on dark.
- App icon: soft-orange pages on a charcoal rounded square. Use the icon container only for
  app/system surfaces, not every button or repeated UI decoration.
- Wordmark: mark + WordPeek, UI font at weight 650, tracking −0.03em. Do not outline
  or replace letterforms with an unrelated display font.
- Clear space: at least one quarter of the mark's width on every side.
- Minimum mark size: 20 CSS px in app content; 16 px only for favicons/tray use.
- Minimum wordmark size: 12 CSS px text with a 20 px mark.
- Never stretch, rotate, add gradients, shadows to the mark, or use a multicolor W.
- Keep the logo out of pronunciation, search, and pagination controls.

PNG app icons are generated from the canonical SVG with npm run brand:icons.
Do not edit raster exports manually. Original logo assets use the app's MIT license.

## Color

Canonical implementation: src/brand/tokens.css. Semantic tokens, not arbitrary
hex values, must be used in component CSS. Theme changes require updating this
guide and reviewing light/dark contrast.

| Role        | Light   | Dark    | Use                                      |
| ----------- | ------- | ------- | ---------------------------------------- |
| Paper       | #F0F0EE | #292C30 | Soft neutral canvas                      |
| Surface     | #ECEDEE | #303338 | Inputs and source panel                  |
| Ink         | #3D4045 | #D6D8DC | Word and definition                      |
| Muted       | #686B70 | #A5A8AE | Metadata and examples                    |
| Accent      | #B54816 | #E9A078 | Small tangerine highlights, focus, brand |
| Accent soft | #E5E6E6 | #35383D | Neutral control background               |
| Line        | #D0D2D3 | #42464C | Neutral separators                       |
| Danger      | #9C3931 | #FFB4A8 | Actionable error text                    |

Ink, muted text, accent text, and danger text must meet WCAG AA normal-text
contrast against their intended surfaces. Lines are decorative, not the sole
indicator of a control or state. Never use color alone to convey meaning.

The owner approved Soft Tangerine on 2026-11-18: gray surfaces and text in both
modes, with orange restricted to small accents. Avoid orange/brown tinted page
backgrounds or borders. Appearance supports System, Light, and Dark.

## Typography

- Interface: locally bundled Manrope Variable → Segoe UI → system-ui → sans-serif.
  No font CDN or runtime font request. Preserve the bundled SIL OFL license.
- Headwords use the same sans-serif stack as the interface. No serif or decorative
  display fonts anywhere in the product.
- Headword: 20 px / 1.15, weight 600, tracking −0.6 px. Wrap long words.
- Definition: 13 px / 1.45, normal weight. This is the visual priority after the word.
- Example: 12 px / 1.45, muted, with a 2 px accent rule. Avoid decorative italics.
- Metadata and related words: 11 px. Footer: 11–12 px. Never shrink content to fit.
- Use tabular numbers for 1 / 3. IPA may use the UI font's Unicode fallback.
- Keep text selectable and test Windows text scaling. Scroll for long entries.

## Layout and content budget

Window width: 304 CSS px. Height fits the content, from 180 to 600 px
(device-independent desktop coordinates), with scrolling for long entries.
It is a utility window, not a dashboard. Spacing uses a dense 2 px scale:
2, 4, 6, 8, 10, 12, 16. Content inset: 10 px. Control corners: 6 px.
Card radius for web/marketing previews: 10 px. The first Windows prototype uses
a rectangular native window; do not imply a rounded transparent native window exists.

Information order:

1. Small app header with settings and dismiss controls.
2. Lookup input in the empty state; a small header search button reveals it after a result.
3. Headword; pronunciation and external-search icon buttons.
4. Part of speech and phonetic text.
5. One meaning and one example if supplied.
6. Up to three sense-specific synonyms and antonyms when supplied.
7. Source/license disclosure and previous/next meanings.

Do not add etymology, translations, AI explanations, ads, daily words, streaks,
large tab bars, or promotional copy to the core card. Future additions need an
explicit product decision. Missing fields disappear; no empty headings.

## Components and interactions

Use Radix Primitives with WordPeek CSS for Select and Tooltip behavior. Do not
introduce a pre-styled design system or replace the approved density defaults.
Keyboard shortcuts use small native `kbd` chips with plus separators.

## Icons and interactions

Use **Lucide**, one consistent outline family. Canonical icons: Volume2,
ArrowUpRight, ChevronLeft, ChevronRight, Settings2, X, Search, ArrowLeft, Check.
Icons: 14 px in 24 × 24 px targets, 1.75 stroke, round caps. Never use emoji icons.
All icon-only controls require an accessible name and a useful tooltip.

- Pronunciation is the only softly filled headword action. Disable it when no
  supported recording exists and explain that state in the label/tooltip.
- External-search arrow identifies the saved engine (for example, “Search Bing”)
  or custom URL in its tooltip and accessible name. It opens the default browser.
- Pagination: ‹ 1 / 3 ›; no wrapping. Disable the unavailable edge. Hide it for
  a single meaning. Update definition, example, and relations together.
- Escape dismisses; outside focus hides the native window. Keyboard arrows move
  meanings except while editing input. Tab reaches every action.
- Focus: 2 px accent outline, 3 px offset. Never remove it without replacement.
- Hover changes background/foreground; avoid scale/bounce effects.
- Loading uses one small pulse and a short status. Honor reduced motion.
- Error states explain the next step and offer retry/web search where appropriate.
- No automatic audio, automatic external navigation, or blocking alerts.

## Approval criteria for visible changes

Before merging UI work, verify at 100% and 200% zoom, light and dark themes,
keyboard-only interaction, missing example/relations/audio, multiple senses,
long words/definitions, loading, network failure, and no-result states. Screenshots
must identify whether they use live data or demonstration fixtures. See docs/testing.md.

The visual board at docs/brand/index.html is a reference, not an alternative token source.
