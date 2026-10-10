# Visitor preferences

The browser stores visitor choices locally under versioned `jc.settings.v1` and `jc.history.v1` keys. The public profile never changes. Settings include three language modes, independent English and Cantonese humour values (1 through 5, default 5), appearance, narration choices, attention preferences, navigation position, and pins. Changes emit `jc-state` with settings only. The shell consumes this event and uses the exported translation helper at its own text boundary.

## Personal wording

The always-visible settings file picker accepts UTF-8 JSON with exactly `schemaVersion` (1) and an `entries` object. Each entry key contains 1 through 160 characters; each replacement is a string of at most 1000 characters. Limits are 256 KiB, 4096 entries and eight nesting levels. Empty replacements intentionally remove text. Duplicate JSON keys, duplicate original strings, unsafe object keys, unknown fields and versions, and control characters are rejected before caching. Validation is atomic. No default mappings ship. The separate local cache is revalidated on startup, never exported, recorded in history, logged or transmitted. Clearing restores shipped wording. Replacement occurs in one pass so replacements cannot cascade into other replacements. Source filenames are not stored.

## History and portability

Settings changes create up to 100 local browser snapshots. Restoring appends a revision. UTF-8 JSON exports include current settings and these snapshots, excluding personal wording and file metadata. Imports validate settings before applying them. This is browser storage history, not Git-backed history. Storage failures report that changes last only in the current tab.

## Search and appearance boundaries

Destination search defaults to literal text. Explicit regular expressions execute in a terminated disposable worker with a 150 ms timeout, input length and inventory limits. The builder supports literal containment, start, end and whole-word templates with validated flags. The complete advanced regex graph, rich inline setting results, exact-element teleport and bulk selection remain unimplemented.

The appearance lab edits a sample's colour, radius, padding, text size and weight. Its capability inventory states which features only preview and which are planned. It does not claim arbitrary-element editing, persistence, full design-system palette derivation or an anchored production element editor.

## Narration

Narration is off by default. Voice pickers enumerate platform voices, update after late enumeration and retain stable voice identities. Missing voices fall back honestly; network-backed voices are identified. Preview queues English then Cantonese using browser speech synthesis. Browser screen-reader detection is unavailable, so users are told to pause narration when using one. The shell may send `jc-narrate` events with English and Cantonese text, category and an optional error flag. The event queue debounces ordinary lines for 250 ms, uses a three-second category cooldown, replaces pending lines in the same category, and serializes tracks. Error facts are not suppressed by cooldown. `setScreenReaderMode` provides an explicit integration boundary, since reliable automatic screen-reader detection is unavailable.

## Remaining contracts

This first unit does not complete all mandatory product contracts. Shared cross-application School mode and credential storage, schedules and external sources, universal anchored editors, complete regex tooling, tab groups and locks, bulk history controls, advanced date filters, broad export formats, palette inline controls, arbitrary-element teleport, local Git history, all humour categories and per-surface localization coverage, and built interaction/capture evidence remain open. No runtime, responsive, installation, deployment or full completeness verdict is claimed from source checks.

## Verification

`tests/preferences.test.mjs` checks bounded settings validation, atomic wording rejection, duplicate keys, private-data export/history exclusion, append-only restore and parser limits. TypeScript is checked separately. Browser interaction and the full viewport/language/theme/display-scale matrix remain required.

No HTTP API belongs to this feature, so a Postman collection is not applicable.

## Local timed rules

The timed-appearance destination adds daily local theme rules with optional dates, native time and date inputs, enable and remove actions. Its bounded version-1 store holds at most 50 rules. Overnight intervals use their starting day, start is inclusive, end exclusive, equal times are rejected, and later matching rules win. `effectiveSettings` and `jc-effective-state` provide temporary values to the shell without overwriting base settings. Browser local timezone and daylight-saving semantics are disclosed. The rules support validated setting patches internally, but visible controls currently cover theme only. Weekday editing, complete rule editing, undo/history, import/export, other setting controls and external sources remain incomplete.
## Local authentication and navigation integration

Personal wording remains dormant on an unauthenticated surface, even when a valid private cache exists. The shared shell must call `setLocalAuthenticated(true)` or dispatch `jc-authenticated` with the boolean `true` only after actual local authentication succeeds; logout must clear that session signal. This signal is memory-only and is never itself evidence of authentication. A missing integration leaves original wording active. The loader ships no private mappings.

Navigation supports left, right, top and bottom, with left as the default. The shared shell must consume the persisted `dock` field to place actual navigation. State application sets the document language to `zh-HK` for Cantonese and `en` for English/bilingual, with `data-locale` retaining the full mode. Integer-only humour validation prevents out-of-range copy indexing. Tonal palette derivation and built contrast verification remain incomplete.

## Expanded registered-element appearance editor

The editor now acts on real elements registered with `registerAppearanceTarget(element, stableId)` or marked with `data-appearance-id`. Context-menu, Shift+F10/ContextMenu-key and a stationary 650 ms touch hold open a bounded panel positioned beside the actual target. Registered colour, background, radius, padding, margin, font size, weight and family changes validate and persist locally. Editor controls are marked targets too. Only 200 target patches can be stored. Arbitrary CSS, URLs, code and event wiring are not accepted. Registration after shell rerenders is required to reapply stored patches; complete document-wide coverage, style history, export, layout editing, text/assets, structure, locks and bindings remain incomplete.

Seed colour now uses Material Color Utilities 0.4.0 `themeFromSourceColor` to derive real light/dark roles. System appearance follows the media query and changes live. Neutral role-pair contrast is checked at seed `#006b60` in both themes. This does not prove every rendered surface's contrast or design parity.

## Browser-local presentation lock

The browser-local presentation lock uses a salted PBKDF2-SHA256 credential derivation (210000 iterations), synchronizes same-origin tabs, supports renaming and forces English while suppressing private wording and language/humour/upload controls. Corrupt storage keeps restricted presentation active and reports the unreadable-record state. The credential never enters settings exports or history. Deleting this website's local record resets the lock, so it is explicitly a user-experience lock rather than a security boundary. A native shared-record bridge across installed applications is not implemented and is stated on the surface. Full suppression of all future features, shared native credentials and the complete unlock ladder remain open.

Private wording activation now requires the verified local vault producer to call `setLocalAuthenticated` directly. Arbitrary DOM authentication events are not accepted. The producer must clear this state on every vault lock, logout and reset. No private mapping ships in source.
