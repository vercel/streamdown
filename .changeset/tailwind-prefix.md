---
"streamdown": minor
---

Add a `prefix` prop that prepends a namespace to all generated Tailwind utility classes (e.g. `flex` becomes `tw:flex`), enabling Tailwind v4's `prefix()` feature for projects that need to avoid class name collisions.
