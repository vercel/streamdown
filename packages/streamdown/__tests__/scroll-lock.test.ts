import { afterEach, describe, expect, it, vi } from "vitest";

describe("scroll-lock reference counting", () => {
  afterEach(() => {
    // Reset module state between tests
    vi.resetModules();
    document.body.style.overflow = "";
  });

  it("locks and unlocks body scroll in a single cycle", async () => {
    const { lockBodyScroll, unlockBodyScroll } = await import(
      "../lib/scroll-lock"
    );

    lockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");

    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("");
  });

  it("keeps scroll locked when nested (lock twice, unlock once)", async () => {
    const { lockBodyScroll, unlockBodyScroll } = await import(
      "../lib/scroll-lock"
    );

    lockBodyScroll();
    lockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");

    unlockBodyScroll();
    // Still locked because activeCount is 1
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("does not go below zero on extra unlock", async () => {
    const { unlockBodyScroll } = await import("../lib/scroll-lock");

    // Unlock without any prior lock — should stay ""
    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("");
  });

  it("fully unwinds nested locks", async () => {
    const { lockBodyScroll, unlockBodyScroll } = await import(
      "../lib/scroll-lock"
    );

    lockBodyScroll();
    lockBodyScroll();
    lockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");

    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");

    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");

    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("");
  });
});
