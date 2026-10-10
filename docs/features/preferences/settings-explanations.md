# Setting explanations and value provenance

Every value edited in Visitor settings has a nearby shipped-default line and a keyboard-operable disclosure explaining its purpose. Open the disclosure to inspect the current base value, current record source, last validated persisted value and effective setting input. Individual resets restore the exact compiled value. Values such as an empty voice selection are shown explicitly rather than called simply “default”.

## Explicit coverage

The handwritten value inventory contains language, English humour, Cantonese humour, message emojis, theme, density, font, text size, seed colour, display name, reduced motion, narration, narration language, English voice, Cantonese voice, speech rate, speech pitch, focus, low stimulation, time awareness, one thing at a time and momentum. Auxiliary disclosures explain the personal-wording file, session screen-reader pause, voice preview, speech stop, settings export, settings import, settings reset and revision restoration. Other feature surfaces retain their own documentation and are not silently claimed covered by this inventory.

## Read-only provenance

The read-only `getSettingsProvenance()` API separates current in-memory state from the last validated settings-record snapshot. It distinguishes missing, loaded, invalid and unreadable startup records. A valid stored record equal to compiled defaults is still reported as stored. Returned snapshots are cloned.

Successful writes to the settings key update the persisted snapshot even if writing history fails afterward. A failed settings write keeps current edits in memory and retains the previously validated snapshot, if available; there is no automatic rollback. History-write success or failure is tracked separately. Neither storage availability nor equality with defaults proves persistence.

The producer supplies explicit edit, import, reset or history-restoration causes. Arbitrary action descriptions do not classify their own cause. This is record-level provenance; the last origin of each individual field is not tracked and the disclosure says so. A malformed same-origin storage event keeps current values but makes persisted provenance unavailable. Removing the settings record restores compiled defaults and marks persistence missing. A local-storage clear event also clears in-memory history. Only events whose storage area is this origin’s local storage are accepted; session-storage and unrelated-area events cannot reset these values.

## Effective inputs and limits

For fields with an implemented scheduled consumer, the disclosure identifies the last matching enabled rule containing that field. It shows the current base value again after expiry. Active presentation restrictions override interface and narration language to English. The effective line describes the setting input: device preferences, available voices and downstream presentation behavior may further adjust the rendered result. It does not claim that every field has a scheduled consumer or infer a field’s origin from a matching value.

Category search indexes the same localized labels, purposes, shipped defaults, current base values and effective inputs used by the disclosures. Hidden language and personal-wording metadata is omitted before indexing while presentation restrictions are active.

## Verification

Focused tests execute actual store, schedule, metadata and disclosure handlers. Handwritten inventories detect omitted explanations and omitted rendered consumers. Tests cover localized disclosure, exact defaults, individual resets, saved defaults, load failures, separate settings/history write failures, explicit producer causes, storage updates/removal and winning-rule expiry. Source tests and responsive styles do not establish built keyboard operation, narrow bilingual layout or installed native acceptance.

## Related articles

- [Visitor preferences](README.md)
- [Timed visitor settings](schedules.md)
