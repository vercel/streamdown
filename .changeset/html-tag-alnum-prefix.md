---
"remend": patch
---

Strip only plausible incomplete HTML tags at end-of-stream.

`handleIncompleteHtmlTag` already skipped math and code, but bare mid-stream tags
like `a<b` (streaming toward `a<b>hello</b>`) need to heal, while comparisons with
prose continuation (`a<b the rest…`) and type parameters (`Array<string…`) must
stay. After an identifier, strip only when the name is a known HTML tag and the
suffix is empty or attribute-like; incomplete tags after whitespace (`Hello <div`)
are still stripped as before.
