# Local companion

The static website and desktop use the same renderer. The optional desktop process owns native dialogs, OS-encrypted local records, isolated Git history and the loopback Ollama adapter. Browser features stay in the website. The companion module registers `companion` through the shared feature registry.

## Security boundaries

The window has a sandboxed preload, context isolation and no renderer Node access. IPC accepts only operations listed in `desktop/security.cjs` from the exact packaged main-frame app://jackson/index.html origin. Requests have a 1 MiB bound. File import/export is selected through native dialogs, and editor access accepts opaque handles created by those dialogs rather than arbitrary paths. External navigation accepts HTTPS and mail addresses without embedded credentials. Browser permission prompts are rejected.

The optional Manifest V3 extension runs only below `https://ding-ding-projects.github.io/jackson-chung/`. The native broker independently checks that scope, a short-lived request timestamp, unique request identifier and explicitly granted pairing capability. Pairing values stay in browser session storage and desktop process memory. Revoking desktop grants invalidates every value and cancels active model tasks. The bridge accepts no shell command or arbitrary filesystem operation. Pairing is not an authentication mechanism against another process already controlling the user's account.

## Packaging and installation

Ship all `desktop/*.cjs` with `dist/`. Include a complete trusted Git distribution at `resources/tools/git/`, including `cmd/git.exe` and its dependent runtime files. Source and packaged execution do not claim PATH Git is bundled. The secure standard app://jackson/ protocol serves only the resolved dist tree and starts the shared renderer at #tools. It supports local fetch and workers without granting Node access. Missing Git produces a recovery state while encrypted saves continue. The desktop/native-host-launcher/ project supplies a self-contained .NET 8 native-host executable launcher. Publish it beside JacksonChung.exe and unpack desktop/native-host.cjs plus its bridge/security modules under resources/app.asar.unpacked/desktop/. The launcher runs only that installed executable and fixed script, sets ELECTRON_RUN_AS_NODE in the child environment, forwards binary standard input/output and discards diagnostic output. Browser-provided arguments are never forwarded. Packaging must separately register a native messaging manifest named `org.jacksonchung.companion`, and a stable approved extension identity. The manifest's allowed extension origin must be that exact identity. Source extension files alone do not establish installed native integration.

Squirrel install/update/uninstall events create or remove shortcuts through the adjacent Update.exe. The application never initiates a computer restart. Automatic updates stay disabled unless packaging supplies `desktop/verified-update.json` with verified source, immutable tag, HTTPS project feed, and both normal-release flags false. There is no guessed update endpoint or success claim before real release metadata exists.

## Records and local history

OS encryption must be available before writing records. The private record file is atomically replaced. Complete encrypted snapshots are recorded in a separate Git directory under the application's own data directory, never the user's source folder. No plaintext snapshot enters history. Restoring a revision creates a new revision. A history write failure does not discard an otherwise successful encrypted save, and the result tells the caller to repair the bundle. Current history UI lists the most recent 100 revisions and supports append-only restore. History browsing and restoring require a local password (set on first unlock), with a five-minute session and explicit lock control. Date/action/regex filtering, diff, labeling, retention, pruning and full history export are not yet implemented, so full history acceptance is pending.

## Ollama

Requests target only `http://127.0.0.1:11434/api/` with fixed tags/ps/chat/pull routes and rejected redirects. Chat and pull responses are streamed as bounded task chunks with cancellation, a 15-minute timeout, an 8 MiB output bound, eight concurrent-task limit and one-minute completed-task retention. Batch downloads run sequentially with exact model identifiers. The UI never guesses hardware or available memory. Missing Ollama provides the official installation link. A complete official catalog API is unavailable in this implementation; the authoritative catalog link is exposed without presenting a fixed sample list as exhaustive. Installed and running models use the official tags and ps endpoints. Metadata responses are limited to 1 MiB and 4096 models, with bounded names and validated nonnegative numeric metadata.

## Verification and remaining acceptance

`tests/desktop-security.test.mjs` exercises scope, navigation, IPC allowlists and payload bounds. Source syntax checks are separate from native execution. Installed Squirrel lifecycle, native host registration, bundled Git resolution, OS encryption behavior, native dialogs, streaming against an actual Ollama service, extension pairing/revocation and the viewport/language/theme/scale capture matrix require genuine installed runtime evidence. These are not proven by source tests.

The complete application feature inventory, history access protection, full extension settings localization/customization and Status Hub integration remain integration-owner acceptance items. The extension popup is a minimal setup control, and does not yet satisfy the full shared interface contract.
