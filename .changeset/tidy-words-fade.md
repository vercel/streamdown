---
"streamdown": patch
---

Preserve pending and active word animations across streaming updates instead of setting their duration to zero before they finish. Apply the same timing to list markers, task checkboxes, images, and horizontal rules.

Allow finite text animations to finish after streaming stops before removing their wrappers. Cleanup follows browser animation completion, including cancellation, rather than using a fixed timeout.

Discard animation history for removed blocks and reset the timeline when content is cleared, so the first words of a replay animate again instead of appearing instantly.

Exclude parser-generated layout whitespace from animation offsets so new words inside lists receive their fade and tight-to-loose list transitions preserve existing text history. Source whitespace remains counted.

Animate fenced code as one unit on the shared timeline, preserving its fade while code and syntax highlighting update.

Use one timestamp per render pass when scheduling blocks, so parsing time cannot let later blocks overtake earlier text.
