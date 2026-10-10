# Independent narration language

Narration is off by default. Choose English, Cantonese, or Both independently of the interface language in Visitor settings. Both speaks English first, then Cantonese after the first utterance ends. Preview uses the same language and voice selection as queued events, and can be requested while event narration is off.

## Local settings

The `narrationLanguage` setting defaults to `en`. Existing version 1 settings and revisions without this field migrate to English. Valid choices are `en`, `yue`, and `both`; invalid values are rejected before changes are applied. The choice is included in local settings storage, history, import, export, reset, and revision restoration. No spoken text is stored by the narration controller.

## School and quiet modes

School mode temporarily forces English without replacing the saved narration language. Turning School mode off restores the saved choice. Low stimulation suppresses ordinary event narration while preserving essential error events. The explicit screen reader pause control suppresses all speech during the current session, including previews. Browsers cannot reliably detect screen readers automatically.

## Device voices and timing

Each language retains its own voice choice by stable voice identity. Voice enumeration updates when the browser reports new voices. A missing saved voice falls back to the first available matching voice; a missing language voice is skipped. The controls disclose unavailable voices and voices requiring network access. Rate and pitch remain shared. Ordinary events retain a 250 ms debounce and three-second category cooldown; essential errors skip these delays. Stopping or replacing speech invalidates old completion callbacks.

## Boundaries and verification

Scheduled narration application remains pending; this editor does not claim that a saved schedule changes narration. Device voice availability and built accessibility behavior require runtime verification. Focused source execution checks exercise language independence, serialized preview and event tracks, School restoration, quiet-mode behavior, cancellation, and schema migration and rejection. These checks are not installed-runtime proof.
