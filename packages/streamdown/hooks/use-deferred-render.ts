import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Default debounce delay in milliseconds before checking if element is still in view
 */
export const DEFERRED_RENDER_DEBOUNCE_DELAY = 300;

/**
 * Default root margin for Intersection Observer
 * Starts rendering when element is 200px away from viewport
 */
export const DEFERRED_RENDER_ROOT_MARGIN = "300px";

/**
 * Default timeout for requestIdleCallback in milliseconds
 */
export const DEFERRED_RENDER_IDLE_TIMEOUT = 500;

export interface UseDeferredRenderOptions {
  /**
   * Debounce delay in milliseconds before checking if still in view
   * @default DEFERRED_RENDER_DEBOUNCE_DELAY
   */
  debounceDelay?: number;
  /**
   * Timeout for requestIdleCallback in milliseconds
   * @default DEFERRED_RENDER_IDLE_TIMEOUT
   */
  idleTimeout?: number;
  /**
   * If true, render immediately without waiting for intersection
   * @default false
   */
  immediate?: boolean;
  /**
   * Root margin for Intersection Observer (e.g., '200px' to start rendering 200px before entering viewport)
   * @default DEFERRED_RENDER_ROOT_MARGIN
   */
  rootMargin?: string;
}

/**
 * Hook for deferred rendering components when they enter the viewport.
 * Uses Intersection Observer + debounce + requestIdleCallback for optimal performance.
 *
 * @param options Configuration options
 * @returns Object containing `shouldRender` flag and `containerRef` to attach to the element
 *
 * @example
 * ```tsx
 * const { shouldRender, containerRef } = useDeferredRender({ immediate: false })
 *
 * return (
 *   <div ref={containerRef}>
 *     {shouldRender && <ExpensiveComponent />}
 *   </div>
 * )
 * ```
 */
export function useDeferredRender(options: UseDeferredRenderOptions = {}) {
  const {
    immediate = false,
    debounceDelay = DEFERRED_RENDER_DEBOUNCE_DELAY,
    rootMargin = DEFERRED_RENDER_ROOT_MARGIN,
    idleTimeout = DEFERRED_RENDER_IDLE_TIMEOUT,
  } = options;

  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTimeoutRef = useRef<number | null>(null);
  const idleCallbackRef = useRef<number | null>(null);

  // Polyfill for requestIdleCallback
  const requestIdleCallbackPolyfill = useMemo(
    () =>
      (callback: IdleRequestCallback): number => {
        const start = Date.now();
        return window.setTimeout(() => {
          callback({
            didTimeout: false,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
          });
        }, 1);
      },
    []
  );

  const requestIdleCallbackWrapper = useMemo(
    () =>
      typeof window !== "undefined" && window.requestIdleCallback
        ? (cb: IdleRequestCallback, opts?: IdleRequestOptions) =>
            window.requestIdleCallback(cb, opts)
        : requestIdleCallbackPolyfill,
    [requestIdleCallbackPolyfill]
  );

  const cancelIdleCallbackWrapper = useMemo(
    () =>
      typeof window !== "undefined" && window.cancelIdleCallback
        ? (id: number) => window.cancelIdleCallback(id)
        : (id: number) => {
            clearTimeout(id);
          },
    []
  );

  useEffect(() => {
    // If immediate, render right away
    if (immediate) {
      setShouldRender(true);
      return;
    }

    const container = containerRef.current;
    /* v8 ignore next */
    if (!container) {
      return;
    }

    // Clear any pending timeout and idle callback
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
      renderTimeoutRef.current = null;
    }
    if (idleCallbackRef.current) {
      cancelIdleCallbackWrapper(idleCallbackRef.current);
      idleCallbackRef.current = null;
    }

    const clearPendingRenders = () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
        renderTimeoutRef.current = null;
      }
      if (idleCallbackRef.current) {
        cancelIdleCallbackWrapper(idleCallbackRef.current);
        idleCallbackRef.current = null;
      }
    };

    const scheduleRender = (obs: IntersectionObserver) => {
      idleCallbackRef.current = requestIdleCallbackWrapper(
        (deadline) => {
          // If we have time remaining or it's urgent, render
          if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
            setShouldRender(true);
            obs.disconnect();
          } else {
            // Otherwise, schedule again with shorter timeout
            idleCallbackRef.current = requestIdleCallbackWrapper(
              () => {
                setShouldRender(true);
                obs.disconnect();
              },
              { timeout: idleTimeout / 2 }
            );
          }
        },
        { timeout: idleTimeout }
      );
    };

    const handleIntersecting = (obs: IntersectionObserver) => {
      clearPendingRenders();

      // Debounce rendering: wait for debounceDelay, then check if still in view
      renderTimeoutRef.current = window.setTimeout(() => {
        // Re-check if element is still in viewport using observer records
        const records = obs.takeRecords();
        // If no records, element hasn't changed state (still intersecting)
        // If records exist, check the latest intersection state
        const isStillInView =
          records.length === 0 || (records.at(-1)?.isIntersecting ?? false);

        if (isStillInView) {
          scheduleRender(obs);
        }
      }, debounceDelay);
    };

    const handleIntersection = (
      entry: IntersectionObserverEntry,
      obs: IntersectionObserver
    ) => {
      if (entry.isIntersecting) {
        handleIntersecting(obs);
      } else {
        clearPendingRenders();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          handleIntersection(entry, observer);
        }
      },
      {
        rootMargin,
        threshold: 0,
      }
    );

    observer.observe(container);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      if (idleCallbackRef.current) {
        cancelIdleCallbackWrapper(idleCallbackRef.current);
      }
      observer.disconnect();
    };
  }, [
    immediate,
    debounceDelay,
    rootMargin,
    idleTimeout,
    cancelIdleCallbackWrapper,
    requestIdleCallbackWrapper,
  ]);

  return {
    shouldRender,
    containerRef,
  };
}
