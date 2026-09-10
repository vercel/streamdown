---
"@streamdown/ascii": minor
---

Add `@streamdown/ascii`, a new plugin package that renders agent-generated ASCII and Unicode box-drawing diagrams (`┌─┐`, `│ │`, `└─┘`, `──►`) as stable preformatted blocks. It binds to ```ascii, ```diagram, and ```chart code fences by default, disables font ligatures so sequences like `-->` don't collapse into a stylized arrow glyph, uses an advance-consistent monospace font stack, and renders each block as a single unbroken text node with no per-line span wrappers so streaming appends never reflow existing rows. Plugs into the existing `plugins.renderers` extension point (`import { ascii } from "@streamdown/ascii"`) with no core changes required.
