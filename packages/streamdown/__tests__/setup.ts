// biome-ignore lint/performance/noNamespaceImport: matchers need to be imported as namespace for expect.extend
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect } from "vitest";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock IntersectionObserver for tests
beforeEach(() => {
  global.IntersectionObserver = class IntersectionObserver {
    private callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    disconnect() {}

    observe(target: Element) {
      // Immediately trigger the callback with isIntersecting = true
      // This simulates the element being visible in the viewport
      setTimeout(() => {
        this.callback(
          [
            {
              isIntersecting: true,
              target,
              boundingClientRect: {} as DOMRectReadOnly,
              intersectionRatio: 1,
              intersectionRect: {} as DOMRectReadOnly,
              rootBounds: null,
              time: Date.now(),
            },
          ] as IntersectionObserverEntry[],
          this as unknown as IntersectionObserver
        );
      }, 0);
    }

    takeRecords() {
      return [];
    }

    unobserve() {}
  } as unknown as typeof IntersectionObserver;
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
