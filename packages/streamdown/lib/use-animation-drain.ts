import { useLayoutEffect, useRef, useState } from "react";

export function useAnimationDrain(
  isAnimating: boolean,
  animatedKey: string,
  mode: "streaming" | "static",
  content: unknown
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [retained, setRetained] = useState(false);
  const enabled = Boolean(animatedKey) && mode !== "static";

  // biome-ignore lint/correctness/useExhaustiveDependencies: New content or animation settings can replace the DOM animations being drained.
  useLayoutEffect(() => {
    if (!enabled || isAnimating) {
      setRetained(enabled && isAnimating);
      return;
    }

    // Read the browser's actual animations after the final chunk commits:
    // a fixed grace period can truncate staggered words or delay reduced motion.
    const pending = (
      containerRef.current?.getAnimations?.({ subtree: true }) ?? []
    ).filter(
      (animation) =>
        "animationName" in animation &&
        String(animation.animationName).startsWith("sd-") &&
        animation.playState !== "finished" &&
        animation.playState !== "idle" &&
        Number.isFinite(animation.effect?.getComputedTiming().endTime)
    );
    if (pending.length === 0) {
      setRetained(false);
      return;
    }

    let cancelled = false;
    Promise.allSettled(pending.map((animation) => animation.finished)).then(
      () => {
        if (!cancelled) {
          setRetained(false);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [isAnimating, enabled, animatedKey, content]);

  return { containerRef, animateText: enabled && (isAnimating || retained) };
}
