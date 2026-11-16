---
"streamdown": patch
---

Count only letters when detecting text direction, so Arabic digits, vowel marks and punctuation no longer push mostly English text to RTL. Text with no letters keeps its direction, so a table cell holding only Arabic digits stays RTL.
