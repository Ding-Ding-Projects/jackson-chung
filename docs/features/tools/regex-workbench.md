# Anchored regular-expression workbench

`src/components/regex-workbench.ts` registers `jc-regex-workbench`. Its independent worker is `src/workers/regex-workbench-worker.ts`. This shared component is ready for search owners to integrate; it does not automatically replace existing local-search or palette implementations.

## Integration API

Place each originating input in that instance's `search` slot. Supply a unique stable `fieldId`, the existing `FeatureContext`, and the visitor's `funnyEn`/`funnyYue` values. There is no global active field or shared query singleton. The adjacent button opens an inline panel attached to that field, including on narrow layouts. `openFor(input)` supports another explicit adjacent trigger. Closing or Escape returns focus to the originating input.

The owning input calls `setSearchState({query})` on input. `getSearchState()` returns a copy of `{query, pattern, flags, mode}`. Plain text is the default. Literal input synchronizes to an escaped pattern; switching to regex preserves that escaped intent. Raw pattern edits synchronize the query back to the same source. Flags remain independent and engine-validated.

Listen for composed, bubbling `jc-regex-change` with `{fieldId,state,valid,error}`. Synchronize the owning input's value from `state.query`; do not interpret `valid: false` as permission to keep stale search results. A valid evaluation emits the current state, while canceled, superseded, invalid and timed-out evaluations remain invalid. `jc-regex-apply` carries only `{fieldId,state}`. It never includes samples, captures or replacement output. Apply updates the field-owned transient history and returns focus. Host filtering must use the selected mode and flags in its own bounded local worker; syntax validation alone does not prove that matching arbitrary records is safe.

The integration inventory still belongs to the host: each existing search, settings filter, dropdown and context-menu filter requires its own instance and binding. This unit adds no new free-standing search input. Its slot is the host field's actual input. Existing preference, palette and tool searches are not claimed migrated by this component's existence.

## Real engine and construction

Evaluation uses the current browser's ECMAScript `RegExp`. Supported flags and advanced constructs are discovered by actual compilation probes. JavaScript does not expose an exact engine implementation version, so none is inferred from a browser name. Guided fragments cover literals, escapes/code points, classes, Unicode properties, set intersection/subtraction, anchors, captures, noncapturing groups, alternatives, quantifiers, lookarounds and backreferences. Unicode-dependent fragments select the required `u` or `v` mode. Atomic groups, possessive repetition, conditionals, subroutines and inline modifiers remain visible; unsupported probes disable those controls with an engine-specific explanation. No PCRE or .NET emulation is attempted.

Token-by-token annotation supplies offsets, lexical kind and group depth as a structured explanation. It is explicitly lexical, not an engine parse tree or a claim about every construct's semantics. Compilation remains the syntax authority. Engine trace and backtracking steps are unavailable because the browser exposes neither.

## Testing and replacement

The worker returns actual match values, UTF-16 ranges, numbered/named captures and optional `d` capture ranges. Navigation enumerates with `g` while preserving sticky/Unicode semantics; replacement uses the original selected flags. Empty matches advance by code point with `u`/`v`, otherwise by UTF-16 code unit, including safe advancement beyond the end.

Replacement supports ECMAScript `$$`, `$&`, prefix/suffix, numbered and named templates. Expansion is bounded before large outputs are built, and tests compare it directly with native replacement behavior. Expected-outcome cases report actual boolean matches and whether the expectation passed. Cases, samples and capture results remain transient. Timing is one measured evaluation, not a complexity proof. Heuristics flag nested repetition, repeated alternatives, backreferences and large samples, but an absent warning never proves adversarial safety.

## Bounds, privacy and persistence

Patterns and queries are at most 2,048 UTF-16 code units; samples 20,000; replacements 4,096. At most 20 cases with 2,000 characters each and 20,000 aggregate characters are accepted. Results stop at 200 matches and 50 captures per match. Aggregate match/capture text and replacement output each stay at or below 40,000 characters. Evaluation has a 150 ms cooperative budget and a 300 ms parent-worker deadline including startup. The parent terminates the worker on deadline, cancellation, edits, closure or disconnect. Old results cannot validate a newer state.

No remote evaluation, logging or automatic sample persistence occurs. Applied query history stays in the component instance. Saving local pattern snippets requires explicit consent and a stable field ID. A missing stable ID leaves snippets transient. Snippet JSON is versioned and limited to 20 records and a 64 KiB import; its schema rejects sample/capture or unknown fields. Import remains transient until explicitly saved. Export/copy happen only through user actions, contain patterns and flags, and warn the user to review pattern content before sharing. Removing a stored snippet preserves other stored records and never persists newly imported transient snippets incidentally.

## Verification and remaining acceptance

`node --test tests/tools-regex-workbench.test.mjs` transpiles the actual worker source and runs it on the host ECMAScript engine. Tests cover plain/regex mode, invalid syntax, no match, Unicode, multiline, zero-width handling, captures, native replacement agreement, case outcomes, runtime feature probes, isolated field-state synchronization, import/privacy bounds, capture-output limits and actual isolated-worker termination during catastrophic backtracking. A strict TypeScript check covers both files.

Real browser control interaction, screen-reader/focus behavior, narrow/high-scale layouts, and complete host search-surface integration remain pending. Node engine tests do not establish those states. A full semantic AST, live execution trace and guarantees about adversarial safety are not supplied.
