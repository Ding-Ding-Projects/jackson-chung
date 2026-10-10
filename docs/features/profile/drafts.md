# Unsaved draft decisions

Retained views may register a draft provider with `registerDraftProvider(owner, {id, label: {en, yue}, isDirty, save?, discard, canDispose?})` from `src/state/drafts.ts`. The returned function unregisters that provider during component teardown. Ownership is resolved through the nearest retained tab, crossing open shadow hosts; standalone views use the explicit standalone scope. Providers keep all draft contents and callback state in their own live views.

The shell's host-close callback checks the same providers before closing a tab. The in-app native close button checks every registered provider. A busy `canDispose` veto preserves the view. The anchored decision offers save, review discard, or emergency cancellation. Escape and browser history navigation cancel and return focus. Save must genuinely clear each provider's dirty state before closure is permitted. A failed or unavailable save keeps views open.

Discard identifies affected provider labels, requires two independent keys and a full-range slider, and then exposes the final discard action. Search filters the displayed provider list without silently changing the decision's all-provider scope. Safe action metadata is appended in memory before each destructive callback. Draft contents are never serialized, archived, logged, or exported here. Providers handling private transient input may intentionally offer no save path; the surface states that limitation and requires explicit discard. Undo of discarded private content is unavailable unless its owning workflow supplies a separate recovery mechanism.

## Boundaries

Only registered providers are protected. Unregistered forms and arbitrary external tab-state mutations are not claimed protected. Browser reload restoration of typed public/nonsecret drafts is not implemented. Browser/operating-system window close, process termination, and native menu shortcuts require the real native bridge to consult this API; only the renderer's in-app close control is covered here. Bulk close is protected only when the caller consults the host/API for every affected tab.

## Focus clearance

The shell measures rendered sticky/fixed header heights through ResizeObserver and viewport changes. The document uses that real clearance for scroll padding, focus margins, and the skip link. Focus entering a covered control scrolls it below the measured header. Actual native/browser geometry and keyboard operation remain separate runtime acceptance.

## Native close handshake

The native main process intercepts the BrowserWindow close event before any renderer content is disposed. It creates one random request ID and asks the isolated preload's registered close callback to resolve the shared draft providers. Only a response from the exact trusted packaged main frame, carrying the current request ID and a strict boolean decision, is accepted. Approval authorizes one repeated close event, then removes the scoped listeners. Concurrent close attempts reuse the pending decision rather than opening competing prompts.

The preload exposes only `onCloseRequested(callback)`, not raw IPC or a separately callable approval function. Cancellation, callback rejection, renderer loss, navigation, malformed or stale responses, and a two-minute timeout leave the window open. The in-app native close operation reaches the same BrowserWindow close event. Native broker teardown occurs at successful `will-quit`, so a cancelled close does not disconnect the still-running workspace.

Source tests exercise the close-event state machine, sender/request validation, cancellation, repeat attempts, timeout/navigation/renderer-loss invalidation, strict preload approval and listener teardown. Actual installed OS close, Alt+F4, unsaved provider UI, cancellation and reopened operation remain unverified until exercised against the rebuilt packaged desktop. This handshake does not defend against process termination or a compromised trusted renderer.
