---
"streamdown": minor
---

Add `listStyle` prop for hierarchical bullet styling in nested lists.

- New `listStyle` prop accepts `"flat"` or `"hierarchical"` (default: `"hierarchical"`)
- Hierarchical mode cycles bullet styles through disc → circle → square based on nesting depth
- Flat mode preserves the previous uniform `list-disc` behavior
- All list elements (`<ul>`, `<ol>`, `<li>`) now receive a `data-depth` attribute for custom CSS targeting
