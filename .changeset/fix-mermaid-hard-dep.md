---
"streamdown": patch
---

fix(deps): remove `mermaid` as a hard runtime dependency

`mermaid` was listed in `dependencies` but the core `streamdown` package
only imports it as a type (`import type { MermaidConfig }`). The actual
mermaid runtime is exclusively used by the optional `@streamdown/mermaid`
plugin — pulling ~75 MB into every install unnecessarily.

This patch replaces the type import with a local structural type for
`MermaidConfig` so no type-level coupling to the `mermaid` package remains
in the distributed typings. Users who want fully-typed mermaid config can
still `import type { MermaidConfig } from 'mermaid'` themselves; the
structural type is compatible.

Fixes #501
