# Third-party notices

## Dictionary text and audio

WordPeek application code and original brand assets use MIT. That license does not
relicense dictionary entries or recordings. Free Dictionary API returns text derived
from Wiktionary and supplies per-entry license/source metadata, and may supply
different licenses for audio. The UI exposes that metadata under Source & License.

No offline dictionary database or pronunciation collection is bundled. Network
content retains its original license and attribution requirements. Do not substitute
the API implementation's code license for the content's license.

## Dependencies

React/React DOM, Vite, Lucide, Electron, and other packages retain their own licenses.
Lucide icons use ISC. Electron distributions include Chromium and associated
license notices supplied by the runtime. Keep those runtime notices in packaged
builds. package-lock.json records the exact dependency inventory. Review packaged
notices before each public release, including new dependencies and source changes.

## Engineering guidance

Vercel skills are linked as references in docs/engineering-references.md, not copied
or redistributed as part of WordPeek. Project instructions are original.

## Manrope and Radix

Manrope is bundled through @fontsource-variable/manrope under SIL Open Font
License 1.1. Copyright 2019 The Manrope Project Authors. The full license is in
assets/fonts/OFL-Manrope.txt and is included in packaged builds.
Radix Select and Tooltip packages retain their MIT licenses.
