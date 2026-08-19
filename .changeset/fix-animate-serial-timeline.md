---
"streamdown": minor
---

fix(animate): serialize streaming animation across blocks

Word stagger now runs on a shared wall-clock timeline so sibling sections no longer fade in on top of each other during streaming. Related cleanup: trailing spaces stay inside animated spans (no early link underlines), animate wrappers drop when streaming ends, already-seen text stays steady under StrictMode, and un-animated streaming is no longer deferred behind a starvable transition.

Inspired by #493, #531, and #536.

Fixes #482
Fixes #535
Fixes #550
Fixes #570
