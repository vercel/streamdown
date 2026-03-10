---
"streamdown": minor
---

Add `meta` prop to `CustomRendererProps`. Custom renderers now receive the raw metastring from the code fence (everything after the language identifier, e.g. ` ```rust {1} title="foo" ` → `meta = '{1} title="foo"'`). The prop is optional (`meta?: string`) and is `undefined` when no metastring is present. Existing custom renderers are unaffected.
