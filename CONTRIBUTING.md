# Contributing to WordPeek

Start with README.md, AGENTS.md, and docs/architecture.md. The same conventions
apply to human contributors and coding agents.

## Before implementation

Open an issue for features, substantial fixes, source changes, or architecture
changes. State the user problem, expected behavior, acceptance criteria, and
privacy/compatibility impact. Discuss scope before large refactors. Small copy
or documentation corrections can go straight to a focused PR.

Use the project board: Backlog → Ready → In progress → In review → Done.
Use milestones for working software: foundation, online lookup, Windows integration,
and first preview. Track optional future features separately.

## Development

Use Node 24 LTS and npm. Run npm ci, then npm run dev. Source formatting is
Prettier; linting is ESLint; TypeScript runs in strict mode. Read the brand guide
before editing UI. No new package is needed for a feature that a small clear
function or platform API handles well.

Branches: feat/12-meaning-navigation, fix/34-popup-focus, docs/56-source-policy.
Use focused, descriptive commits. PR titles use:

```text
feat(dictionary): navigate word meanings
fix(selection): handle unsupported text controls
docs(brand): clarify icon sizing
```

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
An exclamation mark indicates a breaking change. Squash merges use the PR title;
intermediate commit formatting is guidance rather than a merge gate.

## Before opening a PR

- Run npm run check. Tests should verify user behavior or real failure modes.
- Run applicable native checks in docs/testing.md; package changes need a Windows build.
- Include screenshots for UI changes in light and dark mode.
- Link the issue with Closes #number and describe validation and known limitations.
- Update architecture decisions, branding, source notices, or docs when affected.
- Do not include real private selections, credentials, generated builds, or unrelated files.

Main requires a PR, successful CI, and resolved review discussions. Maintainers
review changes and squash merge; a separate reviewer approval is not required
while the project has only one maintainer. CODEOWNERS documents ownership but
does not substitute for review or CI.

## Releases

Use SemVer; 0.x indicates an evolving preview. A release PR updates version,
changelog, source/dependency notices, and verification evidence. Maintainers can
manually run the installer workflow, inspect artifacts, then create a tagged
GitHub release. CI does not publish releases automatically. Unsigned installers
must be described as unsigned; signing and trusted updates are separate work.

## Security and conduct

Report vulnerabilities privately using SECURITY.md. Be kind, specific, and
constructive. Discuss code and behavior rather than people. Accessibility and
English-learner comprehension are acceptance criteria, not optional polish.
