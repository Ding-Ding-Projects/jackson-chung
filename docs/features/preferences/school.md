# Local presentation restriction management

The management screen follows English, Cantonese or bilingual visitor preferences while the restriction is off. While enabled, it uses English only and keeps unavailable presentation capabilities out of its copy. A custom name replaces the default name on this control. Previously saved presentation choices are preserved and return after disabling.

## Credential changes and reset

The first enable operation creates a local credential of 6 through 256 characters. Enabling an already configured restriction needs no new credential; disabling requires the current credential. Change requires the current credential and matching new fields. It replaces the salted PBKDF2 proof while preserving the current enabled state and chosen name. An obsolete credential cannot disable the restriction afterward.

Reset requires the current credential, both explicit confirmation keys and the full confirmation slider. It removes the credential and disables the restriction, while retaining the chosen name. Credential inputs are cleared after every attempt and when the control disconnects. Incorrect credentials, mismatched new fields, incomplete confirmation and storage failures do not report success. A record changed during asynchronous verification invalidates that operation.

## Local boundary and recovery

The record is browser-local and origin-only. Other tabs on the same website origin receive storage changes live. Native shared-record integration across installed applications is unavailable: `nativeShared: false`. This is a user-experience restriction, not a security boundary. Credentials are never included in settings exports, history, logs or documentation.

A malformed or unreadable local record keeps restricted presentation active and refuses management changes. A forgotten credential cannot be recovered here. Intentionally clearing this website's local storage resets the record, and also removes other locally stored website data. There is no hosted recovery or cross-application synchronization claim.

## Verification

Focused tests exercise actual credential handlers, persistence, invalid current credentials, credential replacement, reset confirmation, renamed rendering, all off-state languages, active English and restored presentation choices. Negative fixtures detect removal of current-credential verification. Source checks do not establish built keyboard interaction, responsive layout or installed native acceptance.

## Related articles

- [Visitor preferences](README.md)
- [Unsaved draft decisions](../profile/drafts.md)
