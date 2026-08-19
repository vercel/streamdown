import { type RefObject, useEffect, useRef } from "react";

const BOTTOM_THRESHOLD_PX = 8;

/**
 * Resolve a max-height prop into a CSS value, or `undefined` when disabled.
 * `0` / `Infinity` (and their string forms) turn the constraint off.
 */
export const resolveMaxHeight = (
  maxHeight: number | string | undefined
): string | undefined => {
  if (maxHeight === undefined || maxHeight === 0 || maxHeight === Infinity) {
    return;
  }
  if (typeof maxHeight === "number") {
    if (!(Number.isFinite(maxHeight) && maxHeight > 0)) {
      return;
    }
    return `${maxHeight}px`;
  }
  if (maxHeight === "0" || maxHeight === "none" || maxHeight === "Infinity") {
    return;
  }
  return maxHeight;
};

/**
 * Keeps a scroll container pinned to the bottom while `isActive` is true.
 * Unpins when the user scrolls up; re-pins when they scroll back to the bottom
 * or when a new active session begins (`isActive` false → true).
 *
 * Pass a `contentKey` that changes when content grows so auto-scroll re-runs.
 */
export const usePinnedScroll = (
  isActive: boolean,
  enabled: boolean,
  contentKey?: unknown
): RefObject<HTMLDivElement | null> => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const wasActiveRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!(el && enabled)) {
      return;
    }

    const handleScroll = () => {
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD_PX;
      pinnedRef.current = atBottom;
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [enabled]);

  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      // New streaming session — re-engage pin
      pinnedRef.current = true;
    }
    if (!isActive) {
      pinnedRef.current = true;
    }
    wasActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!(el && enabled && isActive && pinnedRef.current)) {
      return;
    }
    el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
  }, [isActive, enabled, contentKey]);

  return scrollRef;
};
