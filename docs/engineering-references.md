# Engineering references and skills

Project conventions live in AGENTS.md and CONTRIBUTING.md. Upstream skills help
implementation but do not enforce repository policy. CI and branch rules enforce
the automatable parts. Do not assume a skill is trustworthy because it is popular.

Reviewed 2026-11-18:

| Reference                                                                                                                                              | Revision / use                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/skills/react-best-practices)   | Client rendering, effect cleanup, bundle restraint; Next.js/server advice excluded                               |
| [Vercel Web Design Guidelines](https://github.com/vercel-labs/agent-skills/tree/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/skills/web-design-guidelines) | Accessible labels, focus, reduced motion, content overflow, empty states                                         |
| [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)                                                                    | Upstream review reference, checked 2026-11-18; desktop behavior takes precedence over URL-routing/website advice |
| [Electron security](https://www.electronjs.org/docs/latest/tutorial/security)                                                                          | Main/renderer separation, sandbox, CSP, validated IPC and URLs                                                   |
| [GitHub Actions security](https://docs.github.com/en/actions/reference/security/secure-use)                                                            | SHA-pinned actions, minimal token permissions, fork-safe PR jobs                                                 |

These are linked references, not installed or vendored skills. Review any future
project-local skill's complete instructions, scripts, license, and origin before
committing it; record its immutable upstream revision here. Prefer a small relevant
set. Do not download an entire skills marketplace or auto-update executable guidance.
