---
"streamdown": patch
---

Fix type declarations requiring a `shiki` install.

`BundledLanguage`, `BundledTheme`, and `ThemeRegistrationAny` are now defined locally and re-exported from `streamdown`, so consumers can type-check without installing `shiki`. Runtime highlighting remains in `@streamdown/code`, which still depends on `shiki`.
