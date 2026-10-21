import { useEffect, useSyncExternalStore } from "react";
import { importAnimate } from "./import-animate";

type AnimateModule = Awaited<ReturnType<typeof importAnimate>>;

let loaded: AnimateModule | undefined;
let loading: Promise<void> | undefined;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => loaded;
const getServerSnapshot = () => undefined;

export const loadAnimate = (): Promise<void> => {
  loading ??= importAnimate().then(
    (module) => {
      loaded = module;
      for (const listener of listeners) {
        listener();
      }
    },
    (error: unknown) => {
      console.error("[Streamdown] Failed to load the animation:", error);
    }
  );
  return loading;
};

/**
 * The word fade, once loaded. The first `enabled` Streamdown starts the load
 * after it commits; until it arrives, and while hydrating, this is undefined.
 */
export const useAnimate = (enabled: boolean): AnimateModule | undefined => {
  const module = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  useEffect(() => {
    if (enabled) {
      loadAnimate();
    }
  }, [enabled]);
  return enabled ? module : undefined;
};
