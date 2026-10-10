# Portfolio direction

## Status and source

This is a design reference, not a working application or runtime verification. Baseline facts were read from the primary checkout's `src/profile.ts`, `src/app.ts`, and `src/styles/main.css` for the supplied `a2bfa99` baseline. The reference is authored separately on the existing feature branch. No Material Designer creation/export API was available in this session. No browser, screenshot, layout test, deployment, or production change was performed.

## Direction

A personal portfolio with an editorial rhythm: ivory paper, near-black ink, restrained burnt-orange accents, fine rules, a large Jackson Chung wordmark, and generous reading space. Avoid Material Design styling, dashboard rails, command catalogues, invented portraits, and decorative stock photography. The person's experience leads; optional utilities support the visit without taking over it.

首屏以 Jackson Chung 嘅名字同個人經歷為主。米白底、墨黑文字同少量焦橙色，配合清楚嘅段落同細線分隔。工具放喺次要導覽，唔好蓋過個人介紹。

## Content and factual boundaries

Use the approved public name, Toronto location, and `Jackson.jc43@gmail.com`. The opening describes patient service and practical problem-solving, with retail interests clearly presented as career goals. It must not imply previous retail employment, sole project authorship, certifications, or completed production verification.

- IT Support Specialist, React Technologies, Mississauga, April 2024 to August 2025. Hardware, software and network support; accurate tickets and device records; Microsoft 365 and team prioritization.
- Diploma in Computer Systems Technology, Durham College, Oshawa, September 2022 to April 2026. Retain these source dates; do not independently upgrade qualification status.
- Community volunteer, Majestic Court, Ontario: everyday assistance and household waste disposal.
- DC Crew Winter Orientation, Durham College, January 2024.
- Six selected public projects: Desktop Material, Worldlens, GTHA Transit, Material UniGetUI, Material System Care, and yt-dlp Studio. Keep each current development qualification from `src/app.ts` and avoid implying authorship.

No phone number, original résumé attachment, private source, credentials, or invented identity belongs in this reference.

## Layout and addressable reference

`portfolio-reference.html` is a self-contained static reference. Its actual anchors are `#intro`, `#experience`, `#projects`, `#community`, and `#contact`. At 1440 px, a restrained horizontal header leads into a large two-column introduction, followed by ruled editorial sections. At 320 px, the same content becomes one column; navigation wraps, the name remains within its owner, and contact addresses can wrap. Links retain visible keyboard focus and a minimum 44 px target height. No external fonts, images, scripts, or network dependencies are needed to display the reference.

The bilingual reference shows English first and Cantonese beneath it. This demonstrates copy hierarchy, not a functional locale preference. Production must retain independent English, Cantonese, and Both modes, the existing settings and search controls, appearance choices, funny-level preferences, tabs, notifications, accessibility, local privacy boundaries, and optional native capabilities. Do not replace existing working features with reference placeholders.

## Navigation and implementation handoff

Primary navigation: Experience, Projects, Community, Contact. Secondary navigation: Résumé, Docs & Wiki, Tools, Settings. The static reference intentionally renders secondary destinations as plain labels, with an explicit reference-only note, rather than broken or pretend functional controls. Production will wire these to the existing real destinations and preserve their state and accessible names. Keep browser profile navigation distinct from the companion application's productive initial workspace.

Implementation destinations, after separate authorization: profile rendering and shell in `src/app.ts`, factual content in `src/profile.ts`, portfolio presentation in `src/styles/main.css`. Supporting feature implementations remain intact. Reuse the existing local state and localization resources instead of introducing a second preference store.

## Required verification before delivery

This reference has no runtime verdict. Production acceptance must inspect genuine captures and measured bounds at normal 1440 px and minimum 320 px, English/Cantonese/Both, light/dark, and 100/125/150/200% scales. Check long bilingual navigation, large-name wrapping, project descriptions, contact links, focus visibility and sticky-header clearance. Verify keyboard and assistive-technology operation separately. Confirm all existing destinations remain actionable. Public delivery requires the complete current articles and wiki, working internal routes/anchors/assets, exact deployment-source proof, and exact About homepage readback on GitHub Pages. Reference files alone satisfy none of those delivery checks.
