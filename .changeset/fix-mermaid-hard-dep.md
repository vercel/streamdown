---
"streamdown": patch
---

fix(deps): remove `mermaid` as a hard runtime dependency

This patch replaces the type import with a local structural type for `MermaidConfig` so no type-level coupling to the `mermaid` package remains in the distributed typings. Users who want fully-typed mermaid config can still `import type { MermaidConfig } from 'mermaid'` themselves; the structural type is compatible.

Fixes #501
