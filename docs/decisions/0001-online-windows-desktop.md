# 0001 — Online-first Windows desktop prototype

Status: accepted for initial prototype · 2026-11-18

## Context

The owner wants an installed app, an HTML/CSS popover, online dictionary sources,
minimal content, configurable hotkeys, meaning navigation, and default-browser Google
search. The development machine has Node but no Rust/C++ build toolchain.

## Decision

Use Electron with a sandboxed local React/TypeScript renderer and a small main
process. Use Free Dictionary API as a replaceable initial online provider, preserving
source licenses. Windows UI Automation retrieves selections on demand. No offline
dictionary or background clipboard monitoring. Use a tray-based app lifecycle.

## Consequences

We can build and verify without installing a native compiler. Electron carries a
larger runtime than a system-WebView app. UIA compatibility varies by app; manual
entry and explicit clipboard lookup remain available. The public API has no uptime
guarantee and its underlying data is Wiktionary, not a separately curated learner's
dictionary. Future providers need licensing/quality review and their own adapters.

Tauri remains a possible future decision, not a second parallel implementation.
Paid API credentials cannot be safely hidden inside a distributed desktop binary;
future credentialed services require user-supplied keys or a separately designed backend.
