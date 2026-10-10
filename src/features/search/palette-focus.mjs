// Wait for nested render boundaries and cancel stale requests before moving focus.
export async function focusPaletteSearch(palette, isCurrent) {
 await palette.updateComplete;
 if (!isCurrent()) return false;
 const search = palette.renderRoot.querySelector('jc-local-search');
 if (!search) return false;
 await search.updateComplete;
 if (!isCurrent()) return false;
 const field = search.renderRoot.querySelector('[data-primary-search="true"]');
 if (!field) return false;
 await field.updateComplete;
 if (!isCurrent()) return false;
 field.focus();
 return true;
}
