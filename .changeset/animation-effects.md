---
"streamdown": patch
---

feat: accept animation effect objects in `animated.animation`

An `AnimationEffect` bundles a keyframes name with the per-word behavior those keyframes need:

```ts
interface AnimationEffect {
  name: string; // @keyframes sd-<name>
  duration?: number; // default; animated.duration overrides it
  scatter?: number; // max extra delay per word, hashed from its position
  decorate?: (text: string, seed: number) => Record<`data-${string}`, string>;
}
```

`scatter` reveals words in a stable random order instead of left to right. `decorate` adds `data-*` attributes to each word while it animates, for effect styles to use. Other attributes are dropped. String animation names work as before.
