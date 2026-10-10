# Profile and documentation navigation

The profile uses fragment destinations for its main sections. Documentation routes use `#docs/<encoded article identifier>/<encoded heading identifier>`. Article identifiers may contain slashes, which are encoded as part of the identifier. Browser back and forward restore the selected article and heading.

The documentation reader loads the locally bundled `documentation.json` manifest. Category buttons open the category index when it exists, otherwise its first bundled article. Article buttons, related reading, relative Markdown links, and same-article heading links use the same navigation path. Heading identifiers are deterministic and repeated headings receive numeric suffixes. Selecting an article focuses its reading surface; selecting a heading focuses and scrolls that heading. Unavailable articles or headings show an explicit status.

Markdown is rendered through safe text templates. Raw HTML remains text, and executable or file URL protocols are rejected. The reader does not execute embedded scripts, load remote Markdown, or substitute source links for bundled article contents. Unsupported Markdown remains readable text.

## Verification

Focused tests cover encoded article routes, malformed route input, relative article resolution, cross-origin rejection, heading targets, duplicate heading identifiers, raw HTML handling, and unsafe link protocols. Rendered browser navigation and assistive-technology behavior require independent runtime verification.

## Retained workspace integration

The shell connects the reusable tab host with independent DOM nodes keyed by tab ID. Switching tabs retains inactive nodes in memory with hidden and inert states. Closing a tab disposes its node. The new-tab destination picker can create multiple independent tabs for the same destination. Only ordinary destination titles and workspace metadata are persisted; local form values and document content are never serialized by the shell. Views may explicitly mark pending work with `data-unsaved="true"` to veto ordinary closing. Complete automatic unsaved-work detection across all tools is not claimed.

Documentation tabs own separate in-memory article and heading routes. Only the active documentation tab updates the browser fragment. Global history navigation updates the active tab rather than changing every retained reader. Reload restores metadata, not private form contents or per-tab reading state.

The shared command overlay receives all registered destinations, owns Ctrl+Shift+F, and has a visible opener in the shell. The older shell shortcut does not compete with it. Interaction, focus, privacy and overflow acceptance still require the real built browser or desktop surface.

The public website uses an editorial portfolio header with About, Experience, Projects and Contact. More opens secondary profile sections, documentation and local tools. Profile destinations keep the retained tab state without showing a workspace tab strip. Tool destinations retain their tab controls. Search opened through More returns focus to the visible disclosure summary when closed. The desktop companion retains its separate working interface.
