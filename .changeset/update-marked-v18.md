---
"streamdown": patch
---

Update `marked` from `^17.0.1` to `^18.0.11`.

marked v18 no longer folds a block token's trailing blank line(s) into its own `raw`; that whitespace now surfaces as a separate `space` token immediately following the block (e.g. after `html`, `heading`, and `table` tokens). This changed the token stream shape that `parseMarkdownIntoBlocks` consumes, causing a dangling `space` token after a closed custom-tag HTML block to be emitted as its own standalone block. `parseMarkdownIntoBlocks` now folds a `space` token into the preceding block instead of pushing it as a new one, restoring v17-identical block boundaries and counts. The lossless `token.raw` concatenation invariant is preserved.
