import { useEffect, useSyncExternalStore } from "react";
import { importAnimationEngine } from "./import-animation-engine";
import type { AnimationEngine } from "./plugin-types";

const MAX_LOAD_ATTEMPTS = 4;
const FIRST_RETRY_DELAY_MS = 1000;

let loadedEngine: AnimationEngine | undefined;
let loading = false;
let failedAttempts = 0;
let retryAfter = 0;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => loadedEngine;

// The server never has the engine, and hydration must start from what the
// server rendered; a client that already loaded it applies it right after.
const getServerSnapshot = (): AnimationEngine | undefined => undefined;

/**
 * Starts loading the engine unless it is loaded, loading, or waiting out a
 * failure. Every Streamdown shares the one load. After a failure, a later
 * update tries again once 1 s, then 2 s, then 4 s have passed, and the fourth
 * failure is final.
 */
const requestAnimationEngine = (): void => {
  if (
    loadedEngine ||
    loading ||
    failedAttempts >= MAX_LOAD_ATTEMPTS ||
    Date.now() < retryAfter
  ) {
    return;
  }
  loading = true;
  importAnimationEngine().then(
    (engine) => {
      loading = false;
      loadedEngine = engine;
      for (const listener of listeners) {
        listener();
      }
    },
    () => {
      loading = false;
      failedAttempts += 1;
      retryAfter =
        Date.now() + FIRST_RETRY_DELAY_MS * 2 ** (failedAttempts - 1);
    }
  );
};

/**
 * The engine to animate with while `enabled`: the one `plugins.animate` hands
 * over, else the shared lazily loaded one once it has arrived.
 */
export const useAnimationEngine = (
  enabled: boolean,
  provided: AnimationEngine | undefined
): AnimationEngine | undefined => {
  const loaded = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const engine = provided ?? loaded;

  // Runs after every update, so a later update can retry a failed load. A
  // failure sets no state, so it cannot cause an update of its own.
  useEffect(() => {
    if (enabled && !engine) {
      requestAnimationEngine();
    }
  });

  return enabled ? engine : undefined;
};
