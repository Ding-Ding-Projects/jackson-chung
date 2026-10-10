# Visitor preferences

The browser stores visitor choices locally under versioned `jc.settings.v1` and `jc.history.v1` keys. The public profile never changes. Settings include three language modes, independent English and Cantonese humour values (1 through 5, default 5), appearance, narration choices, attention preferences, navigation position, and pins. Changes emit `jc-state` with settings only. The shell consumes this event and uses the exported translation helper at its own text boundary.

## Personal wording

The always-visible settings file picker accepts UTF-8 JSON with exactly `version` (1) and `entries`. Each entry has exactly `original` and `replacement`, both nonempty strings of at most 160 characters. Limits are 256 KiB, 1000 entries and eight nesting levels. Duplicate JSON keys, duplicate original strings, unsafe object keys, unknown fields and versions, and control characters are rejected before caching. Validation is atomic. No default mappings ship. The separate local cache is revalidated on startup, never exported, recorded in history, logged or transmitted. Clearing restores shipped wording. Replacement occurs in one pass so replacements cannot cascade into other replacements. Source filenames are not stored.

## History and portability

Settings changes create up to 100 local browser snapshots. Restoring appends a revision. UTF-8 JSON exports include current settings and these snapshots, excluding personal wording and file metadata. Imports validate settings before applying them. This is browser storage history, not Git-backed history. Storage failures report that changes last only in the current tab.

## Search and appearance boundaries

Destination search defaults to literal text. Explicit regular expressions execute in a terminated disposable worker with a 150 ms timeout, input length and inventory limits. The builder supports literal containment, start, end and whole-word templates with validated flags. The complete advanced regex graph, rich inline setting results, exact-element teleport and bulk selection remain unimplemented.

The appearance lab edits a sample's colour, radius, padding, text size and weight. Its capability inventory states which features only preview and which are planned. It does not claim arbitrary-element editing, persistence, full design-system palette derivation or an anchored production element editor.

## Narration

Narration is off by default. Voice pickers enumerate platform voices, update after late enumeration and retain stable voice identities. Missing voices fall back honestly; network-backed voices are identified. Preview queues English then Cantonese using browser speech synthesis. Browser screen-reader detection is unavailable, so users are told to pause narration when using one. Application event debouncing, category cooldowns and reliable assistive-technology yielding remain incomplete.

## Remaining contracts

This first unit does not complete all mandatory product contracts. Shared cross-application School mode and credential storage, schedules and external sources, universal anchored editors, complete regex tooling, tab groups and locks, bulk history controls, advanced date filters, broad export formats, palette inline controls, arbitrary-element teleport, local Git history, all humour categories and per-surface localization coverage, and built interaction/capture evidence remain open. No runtime, responsive, installation, deployment or full completeness verdict is claimed from source checks.

## Verification

`tests/preferences.test.mjs` checks bounded settings validation, atomic wording rejection, duplicate keys, private-data export/history exclusion, append-only restore and parser limits. TypeScript is checked separately. Browser interaction and the full viewport/language/theme/display-scale matrix remain required.

No HTTP API belongs to this feature, so a Postman collection is not applicable.
