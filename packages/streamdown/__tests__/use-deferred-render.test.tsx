import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDeferredRender } from "../hooks/use-deferred-render";

// Test component that uses the hook
const TestComponent = ({
  immediate = false,
  debounceDelay,
  rootMargin,
  idleTimeout,
}: {
  immediate?: boolean;
  debounceDelay?: number;
  rootMargin?: string;
  idleTimeout?: number;
}) => {
  const { shouldRender, containerRef } = useDeferredRender({
    immediate,
    debounceDelay,
    rootMargin,
    idleTimeout,
  });

  return (
    <div data-testid="container" ref={containerRef}>
      {shouldRender ? (
        <span data-testid="rendered">Rendered</span>
      ) : (
        <span data-testid="placeholder">Placeholder</span>
      )}
    </div>
  );
};

// Store observer instances for manipulation
let observerInstances: any[] = [];

describe("useDeferredRender", () => {
  let originalIntersectionObserver: typeof IntersectionObserver;

  beforeEach(() => {
    vi.useFakeTimers();
    observerInstances = [];

    originalIntersectionObserver = globalThis.IntersectionObserver;

    // Mock IntersectionObserver as a proper constructor
    globalThis.IntersectionObserver = function (
      this: any,
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit
    ) {
      this.callback = callback;
      this.options = options;
      this.observe = vi.fn();
      this.disconnect = vi.fn();
      this.unobserve = vi.fn();
      this.takeRecords = vi.fn().mockReturnValue([]);
      this.root = null;
      this.rootMargin = options?.rootMargin ?? "";
      this.thresholds = [0];
      observerInstances.push(this);
      return this;
    } as unknown as typeof IntersectionObserver;

    // Ensure requestIdleCallback and cancelIdleCallback are available
    if (!window.requestIdleCallback) {
      (window as any).requestIdleCallback = (
        cb: IdleRequestCallback,
        _opts?: IdleRequestOptions
      ) => {
        return window.setTimeout(() => {
          cb({ didTimeout: false, timeRemaining: () => 30 });
        }, 0);
      };
    }
    if (!window.cancelIdleCallback) {
      (window as any).cancelIdleCallback = (id: number) => {
        clearTimeout(id);
      };
    }
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    globalThis.IntersectionObserver = originalIntersectionObserver;
  });

  it("should render immediately when immediate=true", () => {
    const { getByTestId } = render(<TestComponent immediate={true} />);
    expect(getByTestId("rendered")).toBeTruthy();
  });

  it("should not render initially when immediate=false", () => {
    const { getByTestId } = render(<TestComponent immediate={false} />);
    expect(getByTestId("placeholder")).toBeTruthy();
  });

  it("should render when element intersects viewport", async () => {
    const { getByTestId } = render(
      <TestComponent debounceDelay={100} idleTimeout={200} immediate={false} />
    );

    expect(getByTestId("placeholder")).toBeTruthy();

    const observer = observerInstances[0];
    expect(observer).toBeTruthy();

    // Simulate intersection
    await act(() => {
      observer.callback(
        [
          {
            isIntersecting: true,
            target: getByTestId("container"),
          } as unknown as IntersectionObserverEntry,
        ],
        observer as unknown as IntersectionObserver
      );
    });

    // Advance past debounce delay
    await act(() => {
      vi.advanceTimersByTime(150);
    });

    // Advance past idle callback
    await act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(getByTestId("rendered")).toBeTruthy();
  });

  it("should clear pending renders when element leaves viewport", async () => {
    const { getByTestId } = render(
      <TestComponent debounceDelay={100} immediate={false} />
    );

    const observer = observerInstances[0];

    // Intersect
    await act(() => {
      observer.callback(
        [
          {
            isIntersecting: true,
            target: getByTestId("container"),
          } as unknown as IntersectionObserverEntry,
        ],
        observer as unknown as IntersectionObserver
      );
    });

    // Before debounce completes, leave viewport (line 187: clearPendingRenders in non-intersecting branch)
    await act(() => {
      observer.callback(
        [
          {
            isIntersecting: false,
            target: getByTestId("container"),
          } as unknown as IntersectionObserverEntry,
        ],
        observer as unknown as IntersectionObserver
      );
    });

    // Advance past debounce - should NOT render since we left viewport
    await act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(getByTestId("placeholder")).toBeTruthy();
  });

  it("should handle re-entry into viewport with idle callback having pending", async () => {
    const { getByTestId } = render(
      <TestComponent debounceDelay={50} idleTimeout={100} immediate={false} />
    );

    const observer = observerInstances[0];

    // First intersection
    await act(() => {
      observer.callback(
        [
          {
            isIntersecting: true,
            target: getByTestId("container"),
          } as unknown as IntersectionObserverEntry,
        ],
        observer as unknown as IntersectionObserver
      );
    });

    // Advance past debounce
    await act(() => {
      vi.advanceTimersByTime(60);
    });

    // Second intersection triggers clearPendingRenders with idle callback set (line 136)
    await act(() => {
      observer.callback(
        [
          {
            isIntersecting: true,
            target: getByTestId("container"),
          } as unknown as IntersectionObserverEntry,
        ],
        observer as unknown as IntersectionObserver
      );
    });

    // Advance everything
    await act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(getByTestId("rendered")).toBeTruthy();
  });

  it("should handle takeRecords returning non-intersecting entry", async () => {
    const { getByTestId } = render(
      <TestComponent debounceDelay={50} immediate={false} />
    );

    const observer = observerInstances[0];

    // Simulate intersection
    await act(() => {
      observer.callback(
        [
          {
            isIntersecting: true,
            target: getByTestId("container"),
          } as unknown as IntersectionObserverEntry,
        ],
        observer as unknown as IntersectionObserver
      );
    });

    // Set takeRecords to return a non-intersecting entry
    observer.takeRecords.mockReturnValue([
      { isIntersecting: false } as IntersectionObserverEntry,
    ]);

    // Advance past debounce - takeRecords says no longer intersecting
    await act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should NOT render because element is no longer in view
    expect(getByTestId("placeholder")).toBeTruthy();
  });

  it("should clean up on unmount", async () => {
    const { getByTestId, unmount } = render(
      <TestComponent debounceDelay={50} immediate={false} />
    );

    const observer = observerInstances[0];

    // Trigger intersection to set up timeouts
    await act(() => {
      observer.callback(
        [
          {
            isIntersecting: true,
            target: getByTestId("container"),
          } as unknown as IntersectionObserverEntry,
        ],
        observer as unknown as IntersectionObserver
      );
    });

    // Advance past debounce to set up idle callback
    await act(() => {
      vi.advanceTimersByTime(60);
    });

    // Unmount should clean up
    unmount();

    expect(observer.disconnect).toHaveBeenCalled();
  });

  it("should handle idle callback with didTimeout=true", async () => {
    // Override the real requestIdleCallback to simulate didTimeout
    const origRIC = window.requestIdleCallback;
    (window as any).requestIdleCallback = (
      cb: IdleRequestCallback,
      _opts?: IdleRequestOptions
    ) => {
      return window.setTimeout(() => {
        cb({ didTimeout: true, timeRemaining: () => 0 });
      }, 0);
    };

    const { getByTestId } = render(
      <TestComponent debounceDelay={50} idleTimeout={200} immediate={false} />
    );

    const observer = observerInstances[0];

    await act(() => {
      observer.callback(
        [
          {
            isIntersecting: true,
            target: getByTestId("container"),
          } as unknown as IntersectionObserverEntry,
        ],
        observer as unknown as IntersectionObserver
      );
    });

    // Advance past debounce and idle
    await act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(getByTestId("rendered")).toBeTruthy();
    (window as any).requestIdleCallback = origRIC;
  });

  it("should clean up idleCallbackRef on effect re-run (lines 124-126)", async () => {
    // When the effect re-runs (due to dependency change), it should clear any pending idle callback
    const { getByTestId, rerender } = render(
      <TestComponent debounceDelay={50} idleTimeout={200} immediate={false} />
    );

    const observer = observerInstances[0];

    // Trigger intersection to start the process
    await act(() => {
      observer.callback(
        [
          {
            isIntersecting: true,
            target: getByTestId("container"),
          } as unknown as IntersectionObserverEntry,
        ],
        observer as unknown as IntersectionObserver
      );
    });

    // Advance past debounce so idle callback gets scheduled (idleCallbackRef.current is set)
    await act(() => {
      vi.advanceTimersByTime(60);
    });

    // Now re-render with different debounceDelay to trigger the effect cleanup and re-run
    // This should hit lines 124-126 (clearing idleCallbackRef.current on re-run)
    rerender(
      <TestComponent debounceDelay={100} idleTimeout={200} immediate={false} />
    );

    // The new effect should have cleared the old idle callback
    // Now trigger intersection again with the new observer
    const newObserver = observerInstances.at(-1);
    if (newObserver) {
      await act(() => {
        newObserver.callback(
          [
            {
              isIntersecting: true,
              target: getByTestId("container"),
            } as unknown as IntersectionObserverEntry,
          ],
          newObserver as unknown as IntersectionObserver
        );
      });
    }

    // Advance past everything
    await act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(getByTestId("rendered")).toBeTruthy();
  });

  it("should handle idle callback re-schedule when timeRemaining=0 and !didTimeout (lines 149-152)", async () => {
    let callCount = 0;
    // First call: timeRemaining=0, didTimeout=false (triggers re-schedule)
    // Second call: timeRemaining>0 (triggers render)
    (window as any).requestIdleCallback = (
      cb: IdleRequestCallback,
      _opts?: IdleRequestOptions
    ) => {
      callCount++;
      const currentCall = callCount;
      return window.setTimeout(() => {
        if (currentCall === 1) {
          // First call: no time remaining, not timed out -> triggers re-schedule
          cb({ didTimeout: false, timeRemaining: () => 0 });
        } else {
          // Second call: has time remaining -> triggers render
          cb({ didTimeout: false, timeRemaining: () => 30 });
        }
      }, 0);
    };

    const { getByTestId } = render(
      <TestComponent debounceDelay={50} idleTimeout={200} immediate={false} />
    );

    const observer = observerInstances[0];

    await act(() => {
      observer.callback(
        [
          {
            isIntersecting: true,
            target: getByTestId("container"),
          } as unknown as IntersectionObserverEntry,
        ],
        observer as unknown as IntersectionObserver
      );
    });

    // Advance past debounce
    await act(() => {
      vi.advanceTimersByTime(60);
    });

    // First idle callback fires (timeRemaining=0, !didTimeout) -> re-schedules (lines 149-152)
    await act(() => {
      vi.advanceTimersByTime(10);
    });

    // Second idle callback fires (timeRemaining>0) -> renders
    await act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(getByTestId("rendered")).toBeTruthy();
  });
});
