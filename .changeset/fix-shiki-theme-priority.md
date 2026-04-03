---
"streamdown": patch
---

Fix: `shikiTheme` prop now takes priority over the code plugin's default theme.

Previously, the nullish coalescing order was incorrect, causing the code plugin's `getThemes()` to override the explicitly passed `shikiTheme` prop. The order has been swapped so the prop takes precedence.
