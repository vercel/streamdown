import {
  createAnimateTimeline,
  createRenderAnimatePlugin,
} from "./lib/animate";
import type { AnimationEngine } from "./lib/plugin-types";

export type { AnimateOptions } from "./lib/animate";
// biome-ignore lint/performance/noBarrelFile: "required"
export { createAnimatePlugin } from "./lib/animate";
export type { AnimationEngine } from "./lib/plugin-types";

/**
 * The word fade behind the `animated` prop. Pass it as `plugins={{ animate }}`
 * to ship it with your bundle and animate from the first render; without it,
 * Streamdown loads it the first time `animated` is set.
 */
export const animate: AnimationEngine = {
  createBlockPlugin: createRenderAnimatePlugin,
  createTimeline: createAnimateTimeline,
};
