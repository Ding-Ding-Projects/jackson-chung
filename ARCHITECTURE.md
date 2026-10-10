# Architecture and ownership

## Shared browser interface

The website and desktop renderer use the same Vite/Lit interface. Material Web supplies genuine Material Design 3 controls. The static entry is `index.html`, with the root element `jc-app`. All browser-supported functionality is implemented in the renderer, including mobile and offline behavior.

Feature modules export `registerFeature(registry)`. A feature registration is `{ id, title: { en, yue }, group, render(context) }`. `render(context)` returns a Lit TemplateResult. Context supplies `locale`, `translate(en, yue)`, `notify(message, kind)`, `navigate(id)`, and `native` (the optional bounded preload API). Feature registration must not perform privileged work.

## Owned source boundaries

- Public profile and shell: `src/app.ts`, `src/profile.ts`, `src/components/`, `src/styles/`, `index.html`, `public/`, `design/`.
- Visitor state and customization: `src/state/`, `src/features/preferences/`, `src/features/navigation/`, `src/features/appearance/`, `src/features/search/`.
- Local browser tools: `src/features/tools/`, `src/features/converter/`, `src/features/authenticator/`.
- Desktop and browser integration: `desktop/`, `extension/`, `src/features/companion/`.
- Build, packaging and root manifests: integration owner.

## Privacy

Public profile data is immutable visitor content. Personalization affects only the visitor's local view. Private uploads, local files, credentials, authenticator material, and local paths must not enter logs, telemetry, public evidence or source. No analytics or remote fonts. Native capabilities are explicit, paired, revocable, origin-restricted, and allowlisted.

## Evidence

Source, build, package, installed runtime, website deployment, mobile interaction, and feature completeness have separate verdicts. Missing evidence is never inferred from successful source checks.
