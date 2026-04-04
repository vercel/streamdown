---
"streamdown": patch
---

fix(code-block): use absolute positioning for action buttons to fix click events in nested scroll containers

Switches the code block action button wrapper from `position: sticky` to
`position: absolute` (with `position: relative` on the container) so that
hit-testing works correctly in layouts with multiple nested `overflow: auto`
scroll containers. Previously, the `sticky` + `pointer-events-none/auto`
pattern caused browsers to mis-route click events to the code block wrapper
rather than the buttons when the component was embedded in 2+ nested scroll
containers.
