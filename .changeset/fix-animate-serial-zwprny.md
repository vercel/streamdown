---
"streamdown": patch
---

fix(animate): serialize stagger delays across sibling blocks to prevent concurrent animation

Previously all blocks shared a single animate plugin instance and a fixed
`startIndex` of 0, so when a new block appeared during streaming its words
began animating at delay 0 while the preceding block's words were still
animating — resulting in multiple sections revealing concurrently.

This change introduces an `AnimateCursor` — a small shared counter object
that resets to 0 at the start of each React render pass. Each block now gets
its own `AnimatePlugin` instance; the plugin reads the cursor for its start
index, animates its words, and advances the cursor by its word count. Sibling
blocks automatically chain after one another without any manual wiring.

Fixes #482
