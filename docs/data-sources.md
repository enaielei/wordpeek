# Online dictionary source policy

v0.1 uses https://api.dictionaryapi.dev/api/v2/entries/en/<word>. The source was
checked with a live “reluctant” lookup on 2026-11-18; it returned an entry with
en.wiktionary.org provenance and CC BY-SA 3.0 metadata. This is one availability
check, not proof of uptime, comprehensive coverage, or editorial accuracy.

Online access is a product preference, not an assertion that downloaded data is
less accurate. This service distributes Wiktionary-derived entries. Avoid scraping
Google results or depending on reverse-engineered private dictionary endpoints.

## Required adapter behavior

- Normalize bounded user input; query only after an explicit user action.
- Use HTTPS, a timeout, an upper response-size limit, and no blind retries.
- Handle missing entries, unavailable service, rate limits, malformed responses,
  and missing fields without inventing replacement content.
- Preserve sense boundaries and provenance, including text/audio license metadata.
- Show text as plain text and validate all URLs before using them.
- Display source/license information adjacent to the entry, with disclosure allowed
  to keep the core card small. A single text license must not be assumed for audio.
- Do not persist or redistribute dictionary content without reviewing source terms.

The Source & License disclosure provides the original entry link, supplied text
license, presentation-change note, and supplied audio attribution. Displaying only
one sense and limiting relation lists is disclosed there. Before a public stable
release, review attribution completeness against real provider audio records.

## Reliability and provider evaluation

Current provider has reported downtime and no contractual SLA. Use clear failure
states and keep configured web search available; do not promise guaranteed dictionary availability.
Before adding another provider, assess public API support, English-learner quality,
coverage, pronunciation/example completeness, licensing, attribution, limits, costs,
and privacy. Test polysemous words and missing data. Do not splice unrelated senses
from different dictionaries automatically.

Paid publishers may be a better editorial fit, but require a separate decision on
terms and credentials. Never embed a shared paid API secret in a shipped app.
