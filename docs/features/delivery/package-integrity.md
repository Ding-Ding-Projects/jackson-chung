# Package payload integrity

The Squirrel package must contain every file staged for the application, including the self-contained native launcher, its public extension configuration, Chromium notices, renderer archive and bundled Git tree. A successful packaging process alone does not establish that inventory.

`scripts/package-payload.mjs` snapshots every staged regular file by relative path, byte count and SHA-256. The installer explicitly includes the additional root files through the supported `additionalFiles` option. Before publication to the deliverable directory, the verifier reads the complete NuGet ZIP directory, rejects unsafe or duplicate paths and unsupported formats, bounds expansion, decompresses every entry and validates its CRC and size. It then requires every staged payload file to appear with the same bytes and SHA-256.

The payload index and verification receipt remain private build evidence. They contain the source revision and archive digest. Missing or modified payload makes the root installer entrypoint fail; it cannot be represented by an empty successful installer.

## Regression and rejected candidate

The first archive inspection at source `9a0219d40488748e87a1d58fe50ddfdfc952e65d` found that the default installer template omitted `JacksonChungNativeHost.exe`, `native-host-config.json` and `LICENSES.chromium.html`. The candidate was rejected before installation and retained for diagnosis. The new verifier was run against that real candidate and rejected its missing native launcher. Focused tests also reject a valid ZIP with an omitted launcher, a corrupted CRC and traversal/private build paths, then accept a complete valid fixture.

Package CRC, payload/source identity, unsigned status, signer-process observation, installation, browser registration and updater behavior remain separate verdicts. An unavailable process trace is recorded as unverified, never as evidence that no signing process ran.

The corrected candidate at `4548fb0c601da1c6ad67b73152a7eab810838de1` passed the exact installer entrypoint. All 531 archive entries passed CRC and size verification, and all 441 staged files matched their SHA-256 values. The full package is 194,387,435 bytes with SHA-256 `eaffebb379908db79d607fad08130a46cdb629a7ac96ce8548ad6e751b28469a`; its indexed SHA-1 is `E451521B593B6DD633F28D54E91750768ADC4102`. Setup reads `NotSigned`. This package predates later catalogue, transient-draft and native-close integration, and is not installed-runtime or current-source release proof. The extensionless runtime `version` file requires an explicit full destination filename in the NuGet template.

## Recovery and security

Each production attempt has a fresh private output directory. Invalid packages remain there and are not copied into the deliverable folder. Do not install a rejected package, overwrite an unrelated installation, or remove its source evidence to hide a failure. The real Squirrel destination must be preflighted inside a disposable user/VM or a documented supported isolated target. Changing `LOCALAPPDATA` is not an isolation mechanism.
