---
"streamdown": minor
---

perf(animate): load the word fade from its own `streamdown/animate` module instead of bundling it with every app. A component with `animated` set starts loading it after its first commit on the client, even while `isAnimating` is `false`, and components without `animated` never request it. Until it arrives text renders without the fade, and the words already on screen when it arrives don't fade in, so on a cold start the first words of the first animated message appear without a fade. Pass `plugins={{ animate }}` from `streamdown/animate` together with `animated` to bundle it and animate from the first render. `createAnimatePlugin` is still exported from `streamdown`.
