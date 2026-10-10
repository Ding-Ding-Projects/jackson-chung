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
