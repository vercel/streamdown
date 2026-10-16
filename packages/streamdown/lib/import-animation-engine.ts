import type { AnimationEngine } from "./plugin-types";

/** Fetches the word fade's module (its own chunk in the built package). */
export const importAnimationEngine = (): Promise<AnimationEngine> =>
  import("../animate").then((module) => module.animate);
