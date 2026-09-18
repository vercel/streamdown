---
"streamdown": minor
---

feat: add `smooth` prop to pace streams that arrive in large chunks

Some providers and relays deliver text in bursts, such as ~150 characters every ~500 ms, which renders as a jump followed by a pause. With `smooth`, Streamdown measures the time between arrivals and reveals each chunk a word at a time, so it finishes about when the next chunk is expected.

```tsx
<Streamdown smooth isAnimating={status === "streaming"}>
  {markdown}
</Streamdown>
```

- Off by default. When off, rendering is unchanged.
- Only appends are paced. Resets, edits and full-text replacements render immediately, as does content present on mount.
- A word split across chunks is held until it's complete.
- With `animated`, `stagger` defaults to `0`, since pacing already spaces words out. An explicit `stagger` still applies.
- When `isAnimating` becomes `false`, the remaining text appears within 250 ms. Until then, caret, animation and incomplete-Markdown handling stay active, even if `mode` switches to `"static"` in the same update.
- Hidden tabs render immediately, since browsers pause animation frames there.
