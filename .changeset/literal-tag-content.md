---
"streamdown": minor
---

Add `literalTagContent` prop that accepts an array of custom HTML tag names (e.g. `['mention']`) whose children should be treated as plain text, escaping markdown metacharacters so user-supplied labels aren't interpreted as formatting.
