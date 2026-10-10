# Delivery and verification

- [Package payload integrity](package-integrity.md)
- [Installed verification checkpoint](installed-verification.md)

The public website is deployed as static output on GitHub Pages. The desktop companion is a separate Windows application. Browser-compatible features belong on the website itself; native access is explicit and optional.

## Build
Run `build.bat /s` for the static and shared renderer build. Run `build-installer.bat /s` for the unsigned Squirrel.Windows package. Both propagate child failures. Missing supported Node.js tooling is obtained through the official distribution and checked against its published SHA-256 list. The route uses per-user storage and does not require administrator rights.

## Evidence boundaries
Source checks, static output, deployment, installer packaging, installed operation, mobile interaction, updates, and contract completeness have independent results. No successful build certifies the others. Fresh-machine bootstrap remains unverified until a disposable fresh environment is exercised.

## Hosting and public records
The authoritative public home is `https://ding-ding-projects.github.io/jackson-chung/`. The actual live deployment, assets, source metadata and repository About website must be read back before publication is reported verified. Documentation and wiki articles are bundled directly in `documentation.json` for internal reading.

## Security and limitations
Installers are unsigned and may display an unknown-publisher or SmartScreen warning. Update application requires the user's explicit action and does not restart the host. Credentials and private user content are excluded from source and public evidence.

## Related articles
- [Desktop companion](../companion/README.md)
- [Documentation index](../../README.md)

## Verification installation

See [isolated verification installation](isolated-installation.md) for the separately identified Squirrel package and its exact limitations.

## Squirrel lifecycle results

Production install and update hooks create shortcuts before registering the browser native host. Uninstall removes shortcuts before unregistering the matching native host. Both children run with hidden windows and a 15-second timeout. Registration or unregistration still runs if the shortcut child fails; the hook exits nonzero if either child reports an error or a nonzero or missing exit status. Verification mode and obsolete-version hooks launch neither child. Focused tests execute the actual extracted hook with successful, failed, timed-out and unavailable child results. These source tests do not establish installed shortcut, registry or uninstall acceptance.

## Production updates

The desktop updater checks on startup (after a 10-second first-run delay) and every six hours. It discovers the latest normal release through the fixed public project channel, resolves its tag source, and validates metadata and package bytes over HTTPS. No embedded future-version receipt is required. Missing verified feed, verification mode, an unpackaged application, rollback metadata and invalid receipts stay unavailable. Available updates use bounded index and SHA-1/SHA-256 package preflight. Verified bytes are retained in memory for a task-owned loopback feed, so Squirrel cannot refetch different upstream package bytes before applying hooks. The loopback server binds only 127.0.0.1, uses fixed non-secret public-byte routes and validates Host and loopback peer, accepts only exact GET/HEAD routes, limits concurrent requests and lifetime, has no outbound requests or application request logging, and destroys its buffers and sockets at teardown. Actual Squirrel-staged package hashes and candidate source/version are checked before ready and again before restart. Squirrel provides no byte progress event, so downloading remains indeterminate. A shell-wide persistent ready banner and companion controls retain the exact version, release-note link and unsigned warning, with Restart application to install and Later actions. Restart resolves all existing drafts and passes the trusted native close handshake; cancellation or busy work preserves the running workspace. Downloaded updates can also apply on a later application launch.

After publishing an actual normal release with RELEASES, its single full package and build-info.json, run `node scripts/verified-update.mjs <exact-tag>` to verify downloaded release bytes and embedded package source/version metadata. This writes only private `.agent/verified-update.json`. Production packaging validates and includes that receipt when present; verification packaging excludes it. No receipt is fabricated when the release or source evidence is missing. The initial validator accepts a single full-package feed, not delta feeds. Offline, changed hashes or version mismatch remain visible failures. Credentials and arbitrary feed URLs are not accepted.

Focused source fixtures cover lifecycle state ordering, stale events, malformed/rollback receipts, corrupt bytes, verification exclusion, draft cancellation and trusted restart approval. Actual release hosting, download/install, installed restart, data retention and rollback acceptance still require a disposable Windows user or VM. No current normal release or installed-update success is asserted.

The retained-feed route is supported by Squirrel 2.0.1 source. Squirrel records the loopback transport address in its local diagnostic log. This is a non-secret address serving only already-public verified release bytes, with no authentication or confidential resources. The application never exposes the address over IPC. Diagnostic logs remain private and are excluded from source, captures and releases. Installed transport and lifecycle acceptance remain unverified.

Restart uses an identity-scoped request record and lease retained through the dialog and deferred verification. The updater registers that lease before renderer delivery. A later ordinary close invalidates the older restart even when its decision is cancelled or unanswered. Navigation, renderer loss, disposal, timeout and cancellation invalidate the owning attempt. Stale resolution, rejection or cleanup can revoke only its captured lease, never a newer close decision or updater lease. Final installation consumes the matching approval once after staged verification and calls the updater without an intervening await. A subsequent fresh approval can proceed.
