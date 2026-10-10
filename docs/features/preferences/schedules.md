# Browser-local scheduled settings

The scheduled-settings editor creates and manages real browser-local rules. External HTTPS and Home Assistant sources are not implemented. This article describes the verified source behavior and the remaining application and runtime boundaries.

## Editing workflow

Create a named rule, choose its start and end time, optional first and last start dates, weekdays and the values to override. New drafts have no selected values. Every day selects all seven weekdays in one rule. Edit keeps the rule identity. Enable, disable, duplicate and move actions operate on the actual ordered list. Later rules have higher precedence. Search beside the rules, available fields and revision history uses independent local search controls with their full adjacent regex builders.

Invalid or partially entered drafts remain in the editor after a failed save. Native date and time inputs use live-value binding to avoid rewriting an unchanged browser value. Empty numeric values are rejected rather than converted to zero. Switching drafts requires explicit discard confirmation when there are unsaved edits. The draft provider participates in the existing retained-tab close workflow. If an edited rule changes elsewhere, saving fails safely until it is reloaded.

## Available values and pending consumers

The current shell consumes scheduled language, theme, density, font, text size, seed colour, reduced motion and dock edge. Only these eight fields can be newly selected in this editor. Rule values remain local and are validated against the typed settings schema.

Legacy rules may retain other known fields, including humour, message emojis, display name, narration and attention preferences. Their application is pending. The editor labels them unavailable, preserves them during load, import and ordinary save, and permits explicit removal by unchecking an existing field. It does not offer working-looking controls that claim these values are applied. Custom element appearance rules and custom logo scheduling are also incomplete. Complete effective-state adoption across every surface remains a separate unit.

## Timezone and precedence

All times use the browser's local timezone, shown in the editor. Start is inclusive and end exclusive. Equal times are invalid. An overnight interval belongs to the weekday and calendar date on which it starts, including its early-morning portion the next day. Date limits apply to that start day.

The browser's local clock determines daylight-saving behavior. A skipped local time is rejected by the explicit preview. Repeated local times use the browser's interpretation. The computed preview distinguishes available application fields from retained pending values. Clear both preview inputs to use the current time; one incomplete input is invalid. Matching rules merge per field in list order, so a later rule only replaces fields it specifies. With no match, the live base settings apply. The engine never permanently writes a scheduled override into base settings.

## Schema and persistence

Rules export as a versioned object containing `version` and `rules`. Each rule has `id`, `label`, `enabled`, `start`, `end`, `from`, `until`, `weekdays` and `patch`. Unknown rule fields and unknown patch keys are rejected. Identifiers are stable bounded strings. Labels are nonempty and at most 80 characters. Dates must be real calendar dates; weekdays must be a nonempty unique set from Sunday zero through Saturday six. A rule must override at least one known setting. There are at most 50 rules.

The previous version-1 rules-only browser record migrates without inventing new values. The current local record additionally stores bounded revision snapshots. Unknown future versions, corrupted rules or corrupted history fail safe at startup with no overrides active. Invalid cross-tab updates preserve the current valid rules and show a localized status. Persistence writes complete before in-memory rules or history change. A failed storage write keeps the prior state and the unsaved draft.

## History, undo and portability

The browser keeps the newest 20 schedule revisions in a record bounded to 1 MiB. Revisions include initial rules and saved changes. Undo restores the prior snapshot once, records that restoration and disables repeated toggling until another change. A chosen older revision can also be restored. Clearing history uses two confirmation keys and a fully completed slider; it keeps current rules active and leaves a new initial snapshot.

JSON export contains current rules, not local history. Import accepts at most 256 KiB, rejects duplicate JSON keys and validates the entire candidate before any change. Replacing existing rules requires both confirmation keys and the complete slider. Removal and unsaved-draft discard use the same confirmation pattern. Cancel or Escape preserves the current state and returns focus. Pending local file reads can be canceled; older reads cannot replace a newer selection. If rules or history change while an import, removal or history clear is being reviewed, application is rejected rather than overwriting the newer state. Import does not erase a separate unsaved editor draft.

## Privacy and external boundaries

All rules, revision snapshots, searches and previews remain in this browser. Exports may contain user-entered labels and known legacy settings, so review them before sharing. Do not enter credentials or secrets into rule labels or values. Personal wording files, private mappings, next-action text, file bytes and arbitrary form contents are not part of the schedule schema, exports or history.

There is no external-source network implementation, Home Assistant entity integration or operating-system credential-vault route in this unit. No API response, source activation or native execution is claimed. No HTTP API belongs to this local feature, so a Postman collection is not applicable.

## Verification

Executable tests use the actual engine, validator, editor methods and rendered control callbacks. They cover overnight and date anchors, ordered precedence, every-day semantics, base restoration, reload, corrupted storage, atomic storage refusal, duplication, enable state, undo, revision restoration, invalid imports, stale reviews, partial drafts, numeric input, confirmation keys, focus return and independent humour. A handwritten field inventory separates the nine consumed fields from valid legacy fields. Deliberately breaking the overnight start-day anchor made its regression fail before restoration.

A controlled Toronto timezone test rejects the spring-forward skipped preview time. Source and template fixtures do not prove browser picker behavior, native focus, anchored regex operation, responsive geometry, screen-reader output, installed persistence or complete effective-state adoption. English, Cantonese and bilingual built captures and interaction checks remain pending with the integration owner. The full scheduled-settings contract remains incomplete.
