---
"streamdown": patch
---

Fix unnecessary re-renders of code blocks during streaming updates.

**Problem:** In streaming mode, when new content arrives (e.g. a paragraph is appended), completed code blocks that haven't changed were still re-rendering. This happened because the `Streamdown` component used inline object literals as default parameter values for `linkSafety` (`{ enabled: true }`). Every time `children` changed and `Streamdown` re-rendered, these inline defaults created new references, which caused the `contextValue` useMemo to recompute a new `StreamdownContext` object. Since React propagates context changes through `memo` boundaries, any context consumer inside a memoized `Block` (such as `CodeBlock`) would re-render even though the block's own props were unchanged.

**Fix:** Extract the inline default values for `linkSafety` into module-level constants (`defaultLinkSafetyConfig`). This ensures referential stability across renders, so `contextValue` only recomputes when the actual values change — not just because `children` updated.
