# Local browser tools

The `tools` feature is a browser-local workspace shared by the website and desktop renderer. It does not require the native companion or a network request.

## Converter

`pdf-lib` 1.17.1 provides inspect, split, merge, extract, reorder, rotation and title metadata operations. Generated documents reopen before download and page geometry, rotation and metadata are checked. Copy operations preserve selected order. Original file bytes are never written. Inputs are limited to 20 MiB total, 20 files and 500 pages. A dedicated module worker is terminated on cancellation or a 30-second deadline. Outputs are downloaded only after validation.

Interactive form and encrypted PDF sources are rejected. PDF signature dictionaries are detected and rejected. Other opaque PDF features are unsupported. Copy operations do not promise preservation of annotations, attachments, outlines, document metadata or accessibility structure. Do not use these operations for signed or archival documents. Content-level page-order validation and exhaustive opaque-feature handling remain pending.

JSON row arrays, CSV and TSV support quoted fields, embedded delimiters and newlines. Base64 and hexadecimal encode/decode exact bytes. ZIP creation uses bundled `fflate` 0.8.2 and reparses its output. ZIP extraction is disabled until bounded decompression has been implemented. PNG/JPEG inputs can be encoded to PNG, JPEG or WebP through isolated worker canvas when the browser supports it. Header inspection limits dimensions before decode to 8192 pixels per side and 16 megapixels and rejects animated PNG. Outputs are reopened and dimension-checked. Metadata is removed; JPEG/WebP are lossy and JPEG fills transparency white. Audio, video, office spreadsheets and code transformations remain visibly unavailable because verified adapters are absent.

The category selector exposes the required eight categories. Category search, anchored regex builders, image preview, persistent queues, resumable jobs, storage-capacity preflight, session-result export and full localization are unfinished. Current result history stays in memory and contains operation names and dates only. No offline packaged-runtime or browser interaction acceptance is claimed.

## Authenticator

RFC 6238 codes use browser WebCrypto HMAC SHA-1, SHA-256 or SHA-512, six to eight digits and periods from 1 to 86,400 seconds. The default is SHA-1, six digits, 30 seconds. Tests cover all published eight-digit vectors and six-digit suffixes.

Entries are stored in an AES-GCM encrypted local browser-storage vault. A password derives the encryption key using PBKDF2 SHA-256 with 310,000 iterations and a fresh 16-byte salt for each save. Every save uses a fresh 12-byte IV. Plaintext entries remain in memory while unlocked and are cleared when locked or disconnected. Stored secrets have no display or export path. The registration input accepts only new user-supplied material and clears after successful storage.

This is local convenience protection, not server authentication. Same-origin scripts can access an unlocked vault. Browser storage can be evicted or cleared. Resetting a lost vault requires clearing this origin's browser storage and permanently loses its entries. No remote backup exists. Camera/QR import and registration, grouping, search, reorder, bulk actions, protected mutation history and native credential-vault integration remain unfinished. Clipboard writes require browser permission.

## Verification

Run `node --test tests/tools.test.mjs` for synthetic RFC vectors, vault tamper and wrong-password rejection, supported PDF operations, source-byte preservation, table round trips, encoding round trips, malformed sources and byte bounds. These source-level checks do not establish installed-runtime, screen-reader or responsive-layout acceptance.
