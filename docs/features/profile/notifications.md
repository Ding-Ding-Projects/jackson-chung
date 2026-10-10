# Notifications

All feature-context notification calls enter a shared browser-process store. Informational and success messages expire after seven seconds, and progress updates expire after ten seconds. Warnings and errors remain until explicitly dismissed. Hovering or keyboard focus pauses expiry; leaving resumes a full reading interval. Messages stack in the bottom-right corner within a bounded scrollable area and never open informational modal dialogs.

The notification centre reviews both active and dismissed messages for the current process session. History stays only in memory. It is not written to browser storage, telemetry, logs, exports, or tab metadata. Reloading clears it. Messages should contain only safe user-facing summaries, never credentials, file contents, or private payloads.

Dismiss, centre controls and actions use named Material controls with at least 44px targets. Information uses polite screen-reader status announcements; warnings and errors use alerts. Centre labels and action labels support English, Cantonese and bilingual modes. Message bodies retain the wording supplied by their originating feature rather than attempting to reverse-translate a historical string. The centre uses the shared local search and adjacent regex builder when registered, with ordinary text search as the startup fallback.

`publishNotification(message, kind, {title, actions})` accepts optional scoped callbacks for retry, undo, open or details. Callbacks remain in memory, never serialized. An action becomes busy while pending, blocks duplicate execution, and catches failures without exposing exception contents. A generic persistent error directs the user back to the original workflow when an action cannot finish.

## Presentation preferences

Owned category framing, busy guidance, and action-failure guidance each have five English and five Cantonese variants. Independent humour levels select the respective language wording. Serious wording at level 1 and playful wording at level 5 retain the same category and recovery facts. Supplied messages, explicit titles, action labels, filenames, counts, and other producer facts are never rewritten. Explicit titles retain their exact text, with owned category framing beneath them. Active and history items share the same presentation function.

The presentation reads current effective settings, including valid local schedule overrides for language, humour, emoji visibility, and low stimulation, without changing saved base settings. School mode forces English presentation. Scheduled values can be retained and imported by the schedule engine; this consumer does not add schedule-editor controls or claim every scheduled field is consumed elsewhere.

The emoji switch controls relevant decoration beside the title. Decoration is a separate inaccessible element and never enters controls, accessible names, message records, notification search, exports, or clipboard content. Switching it off removes decoration completely. Low stimulation hides only nonessential actionless items from the active stack; warnings, errors, actionable messages, and the complete review history remain reachable.

## Verification and boundaries

Focused source execution also covers five categories across three language modes, all five independent humour levels, unchanged supplied facts, active/history parity, inaccessible decoration and its off state, actual schedule boundaries and base restoration, School presentation, and retained essential records. Deliberate mutations of consumption, language, humour, decoration, and history selection turn the focused checks red. Built presentation and accessibility remain pending. Focused tests cover timeout categories, persistent warnings/errors, reviewable dismissed history, pause/resume, subscriber teardown, duplicate action suppression, rejected callbacks, invalid input and defensive history copies. Actual built focus, stack layout, screen-reader announcements, language switching, seed-color contrast and full per-surface bulk/history capabilities require further verification. Bulk notification deletion/export and durable history are not implemented.
