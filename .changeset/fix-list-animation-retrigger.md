---
"streamdown": patch
---

fix: prevent ordered list animation retrigger during streaming

When streaming content contains multiple ordered (or unordered) lists,
the Marked lexer merges them into a single block. As each new item appears
the block is re-processed through the rehype pipeline, re-creating all
`data-sd-animate` spans. This caused already-visible characters to re-run
their CSS entry animation.

Two changes address the root cause:

1. **Per-block `prevContentLength` tracking** – each `Block` component
   now keeps a `useRef` with the content length from its previous render.
   Before each render the `animatePlugin.setPrevContentLength(n)` method is
   called so the rehype plugin can detect which text-node positions were
   already rendered. Characters whose cumulative hast-text offset falls below
   the previous raw-content length receive `--sd-duration:0ms`, making them
   appear in their final state instantly rather than re-animating.

2. **Stable `animatePlugin` reference** – the `animatePlugin` `useMemo`
   now uses value-based dependency comparison instead of reference equality
   for the `animated` option object. This prevents the plugin from being
   recreated on every parent re-render when the user passes an inline object
   literal (e.g. `animated={{ animation: 'fadeIn' }}`). A stable reference
   is required because the rehype processor cache uses the function name as
   its key and always returns the first cached closure; only the original
   `config` object is ever read by the processor.
