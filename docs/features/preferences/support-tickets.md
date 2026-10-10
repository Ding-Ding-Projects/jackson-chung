# Local support tickets

Support Tickets is a fictional browser-local recovery desk. Nothing is transmitted, no external ticket is created, no network request is made, no service collects the description, and no human reads or answers it. The plain disclosure stays unchanged at every humour level. Descriptions are saved locally, so users are told not to enter passwords, PINs, authenticator secrets, credentials, or private file contents.

## Workflow

Choose a category, a fictional severity, and a safe description of 1–2000 characters. Creation assigns a local ticket number and a canned response generated in the browser. Explicit buttons advance status from Created locally to Reviewed by local rules to Recovery guidance ready. Severity does not change the response or imply escalation. No automatic human response or response-time promise exists.

The list supports local search with its adjacent regex builder, visible-item selection, clearing selection, selected status advancement, selected JSON export, and full JSON export. Category and severity open independently anchored choice dialogs with search and its full builder at the popup head, no-match feedback, arrow navigation between choices, Escape cancellation, and focus return. Description has its own Clear action returning focus to that field. Disabled save, selection, export, and final-status actions have visible reasons. Export deliberately includes entered descriptions and exact local record facts. It does not transmit them. There is no ticket import or in-app delete operation.

## Storage and recovery

Up to 100 tickets are stored under `jc.support-tickets.v1` in this website origin's browser storage. Validation rejects malformed categories, severities, statuses, duplicate identities, descriptions, and timestamps. All mutations use an exclusive browser lock with a fresh validated read and write inside that transaction. A browser without cross-tab lock support rejects saving and keeps the draft. Storage refusal does not replace in-memory records. Invalid cross-tab data keeps current records available. Clearing the website's browser storage clears tickets along with its local settings and drafts.

Recovery guidance identifies the current website origin and `jc.local-lock-credentials`, the browser-local lock credential database. Users review and clear the website's data in their browser settings themselves, after exporting anything they want to keep. This workflow opens no native application-data folder and deletes no data. Native folder integration is unavailable, so no invented path or file-manager success is shown.

## Integration

The feature exports `registerFeature(registry)` and registers destination `support` in the Help group. The shell must adopt that registration. An actual shared draft provider exposes unsaved description and choice changes to Save, Discard, and Cancel handling. Failed saves preserve input, pending writes prevent disposal, and later typed input survives earlier save completion. Forgotten-password and recovery-help buttons in the lock wizard, plus the lock inventory recovery button, dispatch `jc-navigate` with destination `support`. Root Help navigation and complete shell route verification remain integration work until adopted.

Owned desk and canned-response framing use independent English and Cantonese humour settings, three language modes, and serious English under the shared restriction. Every owned label, enum display/search term, stable status code, and message resolves using the same effective locale, including a local schedule override and the shared English-only restriction. Record and export enum values stay literal. Plain errors and disclosure remain factual, and trusted support copy does not pass through personal wording replacement. The disclosure remains unchanged even when a neutral local replacement would otherwise match it. Controls use Material components, named inputs, visible focus, 44px targets, wrapping, and a narrow-layout grid. Built accessibility and layout remain pending.

## Verification and limits

Focused actual-source checks cover creation, status advancement, persistence, exact selected export, bounded records, invalid input, atomic storage failure, corrupted storage, cross-tab refusal, disclosures, language modes, humour levels, registration, lock entry callbacks, browser recovery boundaries, and a throwing no-network boundary. Negative checks reject a wrong destination, unsupported human status, changed export facts, and injected network use. These checks do not prove built navigation, device layout, or native folder capabilities. Bulk deletion, durable export history, universal appearance and lock adoption, and an external support service are outside this bounded unit.
