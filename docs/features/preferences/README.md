# Visitor preferences

The browser stores visitor choices locally under versioned `jc.settings.v1` and `jc.history.v1` keys. The public profile never changes. Settings include three language modes, independent English and Cantonese humour values (1 through 5, default 5), appearance, narration choices, attention preferences, navigation position, and pins. Changes emit `jc-state` with settings only. The shell consumes this event and uses the exported translation helper at its own text boundary.

## Personal wording

The always-visible settings file picker accepts UTF-8 JSON with exactly `schemaVersion` (1) and an `entries` object. Each entry key contains 1 through 160 characters; each replacement is a string of at most 1000 characters. Limits are 256 KiB, 4096 entries and eight nesting levels. Empty replacements intentionally remove text. Duplicate JSON keys, duplicate original strings, unsafe object keys, unknown fields and versions, and control characters are rejected before caching. Validation is atomic. No default mappings ship. The separate local cache is revalidated on startup, never exported, recorded in history, logged or transmitted. Clearing restores shipped wording. Replacement occurs in one pass so replacements cannot cascade into other replacements. Source filenames are not stored.

## History and portability

Settings changes create up to 100 local browser snapshots. Restoring appends a revision. UTF-8 JSON exports include current settings and these snapshots, excluding personal wording and file metadata. Imports validate settings before applying them. This is browser storage history, not Git-backed history. Storage failures report that changes last only in the current tab.

## Search and appearance boundaries

Destination search defaults to literal text. Explicit regular expressions execute in a terminated disposable worker with a 150 ms timeout, input length and inventory limits. The builder supports literal containment, start, end and whole-word templates with validated flags. The complete advanced regex graph, rich inline setting results, exact-element teleport and bulk selection remain unimplemented.

The appearance destination exposes an actual registered-target editor. See the expanded editor section below for supported properties, anchoring and persistence. Complete target coverage and the remaining capability inventory still require verification.

## Narration

Narration is off by default. Voice pickers enumerate platform voices, update after late enumeration and retain stable voice identities. Missing voices fall back honestly; network-backed voices are identified. Preview queues English then Cantonese using browser speech synthesis. Browser screen-reader detection is unavailable, so users are told to pause narration when using one. The shell may send `jc-narrate` events with English and Cantonese text, category and an optional error flag. The event queue debounces ordinary lines for 250 ms, uses a three-second category cooldown, replaces pending lines in the same category, and serializes tracks. Error facts are not suppressed by cooldown. `setScreenReaderMode` provides an explicit integration boundary, since reliable automatic screen-reader detection is unavailable.

## Remaining contracts

This first unit does not complete all mandatory product contracts. Native shared cross-application School mode, complete schedules and external sources, universal editor coverage, complete regex tooling, tab groups and locks, bulk history controls, advanced date filters, broad export formats, palette inline controls, arbitrary-element teleport, local Git history, all humour categories and per-surface localization coverage, and built interaction/capture evidence remain open. No runtime, responsive, installation, deployment or full completeness verdict is claimed from source checks.

## Verification

`tests/preferences.test.mjs` checks bounded settings validation, atomic wording rejection, duplicate keys, private-data export/history exclusion, append-only restore and parser limits. TypeScript is checked separately. Browser interaction and the full viewport/language/theme/display-scale matrix remain required.

No HTTP API belongs to this feature, so a Postman collection is not applicable.

## Local timed rules

The timed-appearance destination adds daily local theme rules with optional dates, native time and date inputs, enable and remove actions. Its bounded version-1 store holds at most 50 rules. Overnight intervals use their starting day, start is inclusive, end exclusive, equal times are rejected, and later matching rules win. `effectiveSettings` and `jc-effective-state` provide temporary values to the shell without overwriting base settings. Browser local timezone and daylight-saving semantics are disclosed. The rules support validated setting patches internally, but visible controls currently cover theme only. Weekday editing, complete rule editing, undo/history, import/export, other setting controls and external sources remain incomplete.
## Local authentication and navigation integration

Personal wording remains dormant on an unauthenticated surface, even when a valid private cache exists. The verified local vault producer must call `setLocalAuthenticated(true)` only after actual local authentication succeeds; logout, lock and reset must clear that session signal. Arbitrary DOM authentication events are not accepted. This signal is memory-only and is never itself evidence of authentication. A missing integration leaves original wording active. The loader ships no private mappings.

Navigation supports left, right, top and bottom, with left as the default. The shared shell must consume the persisted `dock` field to place actual navigation. State application sets the document language to `zh-HK` for Cantonese and `en` for English/bilingual, with `data-locale` retaining the full mode. Integer-only humour validation prevents out-of-range copy indexing. Tonal palette derivation uses the genuine utility described below; full built contrast verification remains incomplete.

## Expanded registered-element appearance editor

The editor now acts on real elements registered with `registerAppearanceTarget(element, stableId)` or marked with `data-appearance-id`. Context-menu, Shift+F10/ContextMenu-key and a stationary 650 ms touch hold open a bounded panel positioned beside the actual target. Registered colour, background, radius, padding, margin, font size, weight and family changes validate and persist locally. Editor controls are marked targets too. Only 200 target patches can be stored. Arbitrary CSS, URLs, code and event wiring are not accepted. Registration after shell rerenders is required to reapply stored patches; complete document-wide coverage, style history, export, layout editing, text/assets, structure, locks and bindings remain incomplete.

Seed colour now uses Material Color Utilities 0.4.0 `themeFromSourceColor` to derive real light/dark roles. System appearance follows the media query and changes live. Neutral role-pair contrast is checked at seed `#006b60` in both themes. This does not prove every rendered surface's contrast or design parity.

## Browser-local presentation lock

The browser-local presentation lock uses a salted PBKDF2-SHA256 credential derivation (210000 iterations), synchronizes same-origin tabs, supports renaming and forces English while suppressing private wording and language/humour/upload controls. Corrupt storage keeps restricted presentation active and reports the unreadable-record state. The credential never enters settings exports or history. Deleting this website's local record resets the lock, so it is explicitly a user-experience lock rather than a security boundary. A native shared-record bridge across installed applications is not implemented and is stated on the surface. Full suppression of all future features, shared native credentials and the complete unlock ladder remain open.

Private wording activation now requires the verified local vault producer to call `setLocalAuthenticated` directly. Arbitrary DOM authentication events are not accepted. The producer must clear this state on every vault lock, logout and reset. No private mapping ships in source.

## Reusable tab workspace

`src/state/tabs.ts` stores only versioned tab metadata: independent tab ID, destination ID, ordinary title, group ID, pin, colour, creation/activity dates, order, active ID and closed-tab metadata. Exact field validation rejects arbitrary form data, file bytes and unexpected fields. There is no small tab-count cap; available browser storage is the real limit and writes can report an error. Multiple tabs may own the same destination. The component supports orientation-correct arrows, Alt+arrow and explicit move controls, pointer drag reordering, pin exclusion from ordinary close, restore, groups, group collapse and colour metadata. Its local search has an adjacent worker-backed regex builder; complete advanced regex capabilities remain open.

The host must connect `connectWorkspaceHost({create, mount, beforeClose, dispose})`. `create(tab)` returns an independent DOM node; `mount(node, tab)` attaches that same node when selected. The connector retains inactive nodes in memory, sets hidden/inert, consumes `jc-tab-close-request`, calls the optional unsaved-work veto and disposes closed nodes. It does not serialize private values or restore form state after reload. The shell handles `jc-tab-new-request` with a real destination picker. Without this connector the metadata component does not claim inactive view retention or an operational close workflow.

The state API also provides create/activate/close/restore/update/move/cycle and group actions. `jc-tabs` carries metadata. MRU cycling is available through `cycleTab(direction, true)`. Four-edge strip orientation uses the existing dock preference, while actual whole-workspace edge placement belongs to the host shell.

Remaining tab work includes all four independently scoped discovery searches, group-local regex search, group-name search, application-wide multi-workspace search, complete group ordering/management, bulk close previews, six-policy locks, full tab appearance tools, full setting-surface adoption and built overflow/reflow verification.

## Command overlay

`src/features/search/palette.ts` provides an actual bounded decorated overlay, typed local search and adjacent regex tools, keyboard arrows/Enter/Escape, actionable registered destinations, group context, pins, card/full-window choice and custom collision-checked Alt+Shift+A–Z/0–9 command bindings. Ctrl+Shift+F remains the reserved opener. The host calls `registerPaletteDestinations(features, navigate)` or `registerPaletteCommands(commands)`, then `installCommandPalette()` once. `openCommandPalette(anchor)` opens beside the originating element and returns focus there on close. Remove competing shell handlers that send the same shortcut to a different destination.

Only registered commands appear. The host must supply every supported action before coverage can be claimed. Rich inline settings, exact-element teleport, full advanced regex graph/captures/snippets, bulk result behavior, drag/resize persistence and complete narrow-layout/assistive-technology verification remain incomplete. Custom bindings and pins store IDs only, never private wording or page values.

## Independent presentation locks

`src/state/locks.ts` implements the six exact policies: PIN, password, PIN plus password, password plus TOTP, PIN plus TOTP, and password plus PIN plus TOTP. Each target has its own ordered factor inventory and credential record; unlocking one does not unlock another. New PINs contain 4–12 digits; passwords contain 8–256 characters. TOTP uses a user-supplied Base32 secret, RFC 6238 HMAC-SHA1, six digits, 30-second periods, one-step clock tolerance and replay-counter rejection. No secret or OTP is printed or exported.

The default browser adapter keeps credential records in the separate `jc.local-lock-credentials` IndexedDB database. PIN/password verifiers use independent random salts and PBKDF2-SHA256 with 210000 iterations. Authenticator material is imported as a nonextractable HMAC key. Ordinary local storage contains only validated target ID, ordinary label, policy, duration and creation metadata. Native operating-system vault storage remains unavailable unless the host supplies `setLockCredentialStore` with a real native adapter. Browser-local storage is explicitly a presentation-lock equivalent, not a security claim.

Every failed manual/keypad submission uses the same verifier and retry budget. Five mismatches trigger a 60-second local cooldown. Concurrent unlock attempts for the same target are rejected. Successful unlock permits this surface, a bounded number of minutes, or the current browser-tab session. The host calls `expireSurfaceLocks` when leaving a surface. All locks start locked after reload. Relock is explicit. Credential replacement/removal requires the existing lock to be unlocked; metadata-write failures restore the previous credential record.

The bilingual anchored wizard exposes all six policies, masked manual inputs, clear actions, a PIN keypad with Backspace/Clear, duration choice, disclosure acknowledgement, cancellation and focus return. Its searchable inventory retains locked entries and offers independent management. The wizard verifies every required factor; a full progressive multi-step factor presentation, randomized keypad option, bulk management, complete history and all context-menu search/adoption remain incomplete.

Host integration APIs:

- `registerLockTarget(id, { label, allowLock, reason })` registers an eligible target or immutable recovery restriction.
- `requireUnlocked(id)` and `withUnlocked(id, action)` must wrap every protected action, shortcut, palette activation and mutation.
- `registerLockElement(element, id, label)` adds capture interception and accessible locked state to an operable target; it opens the anchored wizard instead of running a locked action.
- `openLockWizard(id, anchor)` opens exact target controls. `jc-lock-request` and `jc-lock-state` are payload-free action/state notifications apart from validated metadata.
- `isLocked`, `relockTarget`, `getLocks`, `getLockPermission` and `subscribeLocks` support visible state. Returned metadata and permission records are defensive copies.

This unit guards tab activation, close, reorder and mutation with `tab.<independent-id>`, and appearance mutation/reset with the element ID plus `<id>:property:<css-name>`. The shell still must adopt wrappers and action checks on every relevant destination, group, control, shortcut and future feature. Generic capture interception does not prove disabled-native-control wrapper coverage, immutable DOM mutation resistance, or universal adoption. Native disabled controls need an operable host wrapper. The current wizard and inventory do not claim every mandatory element/state or lock policy input route has built interaction evidence.

Recovery is clearing this website's local storage and its local-lock credential database. These are user-experience locks, not encryption or protection from another person with access to the browser. Missing credential storage fails closed with an actionable message; no fake authentication result grants access.

## Navigation repair and compact strip

Every tab-state save now checks the selected target lock. Closing an active tab selects the most recently used unlocked fallback, or leaves no active tab when none is available. Restoring a locked closed tab checks permission before changing the open/closed inventory. Restored browser metadata never activates a locked saved target. The retained host observes lock changes and hides/inerts locked nodes instead of mounting protected content.

Palette result navigation is limited to the primary query field and result rows. Nested regex inputs, selects and custom-binding editors keep their own Enter and arrow behavior. Escape remains the overlay dismissal. Tab arrows, Home and End use the actual rendered order, excluding filtered and collapsed-group children, and all successful keyboard selections move focus to the rendered tab button.

The strip opens compact by default: an internally scrolling rail plus accessible New, Restore and Manage affordances. Search, its adjacent regex tools, per-tab actions, groups and recent-tab controls are progressively disclosed inside a bounded management region. Vertical rails are height-bounded; horizontal rails own horizontal scrolling. Actual 320 px reflow and new-design height measurements still require built evidence.

The shell passes `.destinationTitles` as an ID-to-localized-string map. New destination tabs record `titleMode: destination`; changing a title records `titleMode: custom`. Explicit custom titles render verbatim. Existing known shipped titles use the destination map, while unknown legacy titles remain unchanged. Search result counts retain numbers rather than translated strings and translate afresh during render, so switching language updates cached results without rerunning the query.

Focused regressions watched locked fallback, locked restore, nested palette Enter, filtered tab arrow order and Home focus fail before their repairs. Positive checks also cover the primary palette query, collapsed groups, custom-label preservation and cached count localization. These are source/handler checks, not browser pixel or assistive-technology acceptance.
