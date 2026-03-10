---
"streamdown": patch
---

Add staggered `animation-delay` to streaming word/character animations so new content cascades in sequentially instead of all animating simultaneously. Configurable via the new `stagger` option (default 40ms). Set `stagger: 0` to restore the previous behavior.
