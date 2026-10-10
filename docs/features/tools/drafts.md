# Transient local tool drafts

The converter, queue intake, manual authenticator form and new-registration form register explicit draft providers with the shared tab owner. Providers inspect named fields and selected-file references. No form serializer, secret history, secret export or secret persistence is introduced by this integration.

Queue intake retains the browser selection and advances its cursor only after each durable write succeeds. A partial storage failure leaves remaining sources available for retry. Previously queued sources are preserved. Discard drops only the unsaved selection and its field reference, without changing the original files or durable jobs. Active intake, queue processing and vault operations veto disposal.

The direct converter draft save writes each selected source to the durable queue. Successful direct output or durable enqueue clears the completed input. Settings without sources cannot be saved as a conversion. Manual authenticator save requires an explicitly unlocked vault; registration save requires a matching live code and a successful encrypted vault write. Failed writes retain the registration. The new-registration component uses a direct callback acknowledging actual storage, with no secret-bearing DOM event.

Tool-section navigation checks the shared draft registry before replacing forms. Complete or clear the current inputs before changing sections. Tab close decisions remain owned by the host shell. Browser refresh recovery applies to already queued sources, not to transient unsaved inputs. Browser navigation and cross-origin termination acceptance remain host responsibilities.

Verification: `node --test tests/tools-intake.test.mjs` exercises partial save/resume without duplication, busy disposal veto, discard preserving completed writes and original source bytes. Strict TypeScript checks cover the provider integration. Built browser close-dialog, camera permission and secret-privacy acceptance require runtime verification.

Asynchronous completion compares the current named converter inputs and selected file references with the operation snapshot. Newer edits remain unsaved and are not reset. Worker requests, download extensions and operation history use that captured operation. Registration confirmation similarly clears only unchanged form inputs; after a successful write, it removes the completed QR and entry while preserving newer account or URI input. Failed writes preserve the pending entry.

`tests/tools-draft-late-reset.test.mjs` executes the actual TypeScript methods with delayed worker and vault acknowledgements. The previous source fails both late-reset regressions; repaired source passes, with separate checks for every editable converter option. These method fixtures do not replace browser acceptance.
