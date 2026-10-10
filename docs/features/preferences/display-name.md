# Visitor display name

The local display-name preference changes the visible workspace brand, browser document title and native titlebar. It is visitor presentation only. It does not rename Jackson Chung, change résumé or contact facts, replace the copyright owner, or alter package identifiers, storage keys, update feeds or diagnostic identity.

## Empty names and text handling

The presentation resolver trims leading and trailing whitespace for display. An empty or whitespace-only value displays the fixed shipped name, Jackson Chung. The stored preference remains exactly as entered. HTML-like input is rendered as text through Lit and assigned to the browser title as text, never inserted as markup.

## Persistence and temporary rules

The existing visitor settings record stores the value locally and includes it in settings export and validated import. Reload restores the stored value. Clear keeps an empty stored value with the shipped presentation fallback; reset restores the default preference.

Timed rules may override the display name through effective settings. The shell consumes that effective value without replacing the stored base preference. When the rule expires or is disabled, the current base display name returns. The schedule editor lists display name as available because this effective consumer is implemented.

## Verification and limits

Focused tests exercise the actual resolver, shell assignment, browser-title and native-titlebar templates, plain-text HTML-like input, settings export/import/reload and temporary-rule expiry. Negative fixtures detect missing projection, assignment, title consumption and schedule registration. These source and handler checks do not establish actual built layout, browser interaction or installed native behavior.

## Related articles

- [Visitor preferences](README.md)
- [Timed visitor settings](schedules.md)
