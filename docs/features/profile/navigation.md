# Profile and documentation navigation

The profile uses fragment destinations for its main sections. Documentation routes use `#docs/<encoded article identifier>/<encoded heading identifier>`. Article identifiers may contain slashes, which are encoded as part of the identifier. Browser back and forward restore the selected article and heading.

The documentation reader loads the locally bundled `documentation.json` manifest. Category buttons open the category index when it exists, otherwise its first bundled article. Article buttons, related reading, relative Markdown links, and same-article heading links use the same navigation path. Heading identifiers are deterministic and repeated headings receive numeric suffixes. Selecting an article focuses its reading surface; selecting a heading focuses and scrolls that heading. Unavailable articles or headings show an explicit status.

Markdown is rendered through safe text templates. Raw HTML remains text, and executable or file URL protocols are rejected. The reader does not execute embedded scripts, load remote Markdown, or substitute source links for bundled article contents. Unsupported Markdown remains readable text.

## Verification

Focused tests cover encoded article routes, malformed route input, relative article resolution, cross-origin rejection, heading targets, duplicate heading identifiers, raw HTML handling, and unsafe link protocols. Rendered browser navigation and assistive-technology behavior require independent runtime verification.
