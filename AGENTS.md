# WordPeek contributor and agent contract

Read this file and CONTRIBUTING.md before changing code. Read docs/architecture.md
for boundary changes and docs/brand-guidelines.md for all visible UI work.
These repository instructions are authoritative for project conventions; upstream
skills are supporting references, not permission to override the product scope.

## Product invariants

- Installed desktop app, Windows first. Online dictionary sources only for v0.1.
- HTML/CSS popover: one sense, one example, pronunciation, up to three synonyms
  and antonyms, previous/next meanings, configured web search. Hide absent information.
- Preserve source/license metadata and sense relationships. Never invent dictionary content.
- No browser extension, offline data packs, AI provider, telemetry, paid backend,
  history, auto-start, or persistent clipboard monitoring without a scoped issue.
- Selection means the user's explicit selection, never full page or document text.
- External search uses validated saved presets or a user-configured HTTPS `{query}`
  template. Never accept a raw destination URL from the renderer search request.
- All UI typography is sans-serif. Core popover is 304 px wide with 10 px content
  padding. Use locally bundled Manrope, Radix Select/Tooltip primitives, softened
  neutral surfaces, and restrained tangerine accents (see approved tokens).
- Appearance settings support System, Light, and Dark. Preserve shortcut chips
  and keyboard behavior; Escape closes a Radix menu before closing Settings.
- Brand name is WordPeek, never Wordpeek or Word Peek. Use canonical assets/tokens.

## Boundaries and security

- Native OS actions and online desktop requests belong in electron/, UI in src/.
- Keep the renderer sandboxed with context isolation and Node integration disabled.
- Preload exposes narrow named operations. Validate IPC sender and all arguments.
- Never execute selected/provider text as code, HTML, shell arguments, or PowerShell.
- Add neither general shell execution nor arbitrary per-request external URLs to the bridge.
- Never log selections or provider responses. Do not commit credentials or .env files.
- Do not silently read/overwrite the clipboard or change Windows execution policy.
- Dictionary requests have bounded input, response size, and timeout.

## Workflow

1. Link substantive work to an issue with acceptance criteria. Tiny typo fixes are exempt.
2. Branch: feat/<issue>-slug, fix/<issue>-slug, docs/<issue>-slug, or chore/<issue>-slug.
3. Keep changes focused. Open a PR; never push feature changes directly to main.
4. PR title uses Conventional Commits. Squash merge; branch commits should also be descriptive.
5. Run npm run check. For native changes, also npm run package:win and complete
   applicable checks in docs/testing.md. Do not report unavailable checks as passed.
6. UI changes need screenshots, keyboard testing, and light/dark checks.
7. Update documentation, notices, and decision records when behavior/contracts change.
8. Do not disable checks or bypass branch rules to obtain a merge.

For a one-maintainer project, passing checks and maintainer review are required;
do not configure a second-person approval rule until another reviewer is available.

## Dependency and skill changes

Commit package-lock.json; use npm ci in CI. Record exact installed versions in
package.json. Pin GitHub Actions to full commit SHAs and use minimal permissions.
Review new dependencies and skill instructions before adding them. Record upstream
skill revisions in docs/engineering-references.md. Do not run bulk skill installers
or introduce mutually contradictory instruction sets.

Use Vercel React performance guidance only where it applies to a client-side
desktop UI; Next.js server architecture and deployment advice do not apply.
Do not add abstractions solely because a skill demonstrates them.
