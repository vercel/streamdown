---
"streamdown": patch
---

perf(animate): load the word fade from its own chunk instead of bundling it with every app. A component with `animated` set starts loading it after its first commit on the client, and components without `animated` never request it. Until it arrives, text renders without the fade, and the words already on screen when it arrives don't fade in, so on a cold start the first words of the first animated message appear without the fade.
