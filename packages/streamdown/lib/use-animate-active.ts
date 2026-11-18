import { useEffect, useLayoutEffect, useState } from "react";
import type { AnimateTimeline } from "./animate";

interface UseAnimateActiveOptions {
  /** Fade duration (ms) of the animate plugin. */
  duration: number;
  /** Skip the post-stream hold timer (static mode never animates). */
  enabled: boolean;
  isAnimating: boolean;
  timeline: AnimateTimeline | null;
}

/**
 * Whether the animate plugin should still be applied to blocks.
 *
 * `true` while `isAnimating`, and afterwards until the timeline's last
 * scheduled word has started and finished fading. Dropping the plugin as soon
 * as `isAnimating` turns false would re-render every block without its
 * `data-sd-animate` spans, making words still waiting on `--sd-delay` (or
 * mid-fade) appear in a single frame (#669).
 *
 * Also drives the timeline's render-pass protocol: `beginPass` during render
 * (so a StrictMode double-render recomputes the same delays instead of
 * stacking, #482) and `commitPass` in a layout effect after paint (so
 * discarded concurrent renders can't poison the cursor).
 */
export const useAnimateActive = ({
  duration,
  enabled,
  isAnimating,
  timeline,
}: UseAnimateActiveOptions): boolean => {
  const isActive =
    isAnimating ||
    (timeline !== null && timeline.now() < timeline.lastStartAt() + duration);

  if (isActive && timeline) {
    timeline.beginPass(timeline.now());
  }

  useLayoutEffect(() => {
    if (isActive) {
      timeline?.commitPass();
    }
  });

  // Re-render once the hold runs out so the spans come off. The state value is
  // only a trigger; a timer that fires a hair early simply re-arms.
  const [, setHoldTick] = useState(0);
  useEffect(() => {
    if (isAnimating || !enabled || !timeline) {
      return;
    }
    const remaining = timeline.lastStartAt() + duration - timeline.now();
    if (remaining <= 0) {
      return;
    }
    const timer = setTimeout(() => setHoldTick((tick) => tick + 1), remaining);
    return () => clearTimeout(timer);
  });

  return isActive;
};
