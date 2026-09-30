---
"streamdown": patch
---

Check whether a stream only appended text by comparing a slice of the new input with the previous one instead of calling `startsWith`, which compared the whole document character by character on every update.
