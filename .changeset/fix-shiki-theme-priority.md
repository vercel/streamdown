---
"streamdown": patch
---

Fix: `shikiTheme` prop priority chain is now fully reachable.

Previously, `shikiTheme` had a default value in the props destructuring (`= defaultShikiTheme`), making the `plugins?.code?.getThemes()` fallback unreachable in both orderings. The fix removes the destructuring default and moves it to the end of the nullish coalescing chain, so all three levels are reachable:

1. Explicit `shikiTheme` prop (highest priority)
2. Code plugin's `getThemes()` (second priority)
3. Built-in `defaultShikiTheme` (final fallback)
