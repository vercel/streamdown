---
"streamdown": patch
---

Stop treating self-closing custom tags as containers: they no longer turn later blank lines into `<!---->`, which split loose lists, or pair with a later closing tag. Leave a custom tag that follows text on its line as inline HTML, so a line break inside it no longer moves its body out of the tag.
