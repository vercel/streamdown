---
"streamdown": patch
---

fix(tailwind): export STREAMDOWN_CLASSES and getSourceInline() for Tailwind v4 prefix support

When using Tailwind v4's `prefix()` option, the Tailwind scanner cannot match
unprefixed class names in streamdown's dist files to the prefixed utilities it
generates (e.g. it looks for `tw:flex` but dist files only contain `flex`).

This patch adds a new `streamdown/tailwind` entry point that exports:
- `STREAMDOWN_CLASSES` – a readonly array of every Tailwind utility class used
  by streamdown and its official plugins
- `getSourceInline(prefix?)` – returns a ready-to-paste Tailwind v4
  `@source inline(...)` directive with all classes, optionally prefixed

Users can now generate the correct `@source inline()` directive for their
prefix and add it to their CSS file.
