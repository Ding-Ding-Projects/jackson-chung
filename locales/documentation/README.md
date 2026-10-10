# Documentation locale resources

The explicit 16-article inventory lives in `scripts/documentation-resources.mjs`. Cantonese Markdown mirrors each English path under `locales/documentation/yue/`, outside the English article scan. Every file begins with a `documentation-locale` JSON comment containing the canonical LF UTF-8 English source SHA-256, translated title, category, and complete related-reading IDs from the inventory. Its first heading matches the translated title.

Translations preserve heading level/order/count, exact inline code, commands, URLs, source IDs and Markdown link/image targets. The reader derives canonical heading IDs from English. Cantonese mode uses those same IDs; bilingual mode renders English canonical anchors and separate `--yue` headings, avoiding duplicate IDs. Search indexes only the active presentation. Article identity and source paths never change by language. Related-reading links navigate inside the reader and show localized titles.

Missing, stale, title-mismatched, structurally mismatched or incomplete resources remain explicit failures. The build preflight rejects incomplete localization before bundling; the reader can display an honest English fallback for older or externally incomplete manifests. This is not a claim that English is translated. Reader-owned guidance uses independent English/Cantonese humour settings without changing factual article content. No runtime translation service or private wording payload is shipped.

Full article regex search, adjacent advanced builder coverage, total full-body worker bounds and complete accessibility/layout/runtime acceptance remain separate work. The language unit keeps the existing ordinary article search and does not label it complete regex coverage.

Source binding normalizes CRLF to LF before hashing UTF-8 bytes, matching canonical Git text content. It never removes prose or ignores semantic changes. LF and CRLF checkout forms therefore have the same source binding; any changed source wording remains stale.
