import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  PluginContext,
  useCjkPlugin,
  useCodePlugin,
  useMathPlugin,
  useMermaidPlugin,
  usePlugins,
} from "../lib/plugin-context";

describe("plugin-context hooks", () => {
  const wrapper =
    (value: any) =>
    ({ children }: { children: ReactNode }) => (
      <PluginContext.Provider value={value}>{children}</PluginContext.Provider>
    );

  describe("usePlugins", () => {
    it("should return null when no provider", () => {
      const { result } = renderHook(() => usePlugins());
      expect(result.current).toBeNull();
    });

    it("should return plugins when provided", () => {
      const plugins = { code: { name: "code" } };
      const { result } = renderHook(() => usePlugins(), {
        wrapper: wrapper(plugins),
      });
      expect(result.current).toBe(plugins);
    });
  });

  describe("useCodePlugin", () => {
    it("should return null when no plugins", () => {
      const { result } = renderHook(() => useCodePlugin(), {
        wrapper: wrapper(null),
      });
      expect(result.current).toBeNull();
    });

    it("should return code plugin when available", () => {
      const codePlugin = { name: "code" };
      const { result } = renderHook(() => useCodePlugin(), {
        wrapper: wrapper({ code: codePlugin }),
      });
      expect(result.current).toBe(codePlugin);
    });
  });

  describe("useMermaidPlugin", () => {
    it("should return null when no plugins", () => {
      const { result } = renderHook(() => useMermaidPlugin(), {
        wrapper: wrapper(null),
      });
      expect(result.current).toBeNull();
    });

    it("should return mermaid plugin when available", () => {
      const mermaidPlugin = { name: "mermaid" };
      const { result } = renderHook(() => useMermaidPlugin(), {
        wrapper: wrapper({ mermaid: mermaidPlugin }),
      });
      expect(result.current).toBe(mermaidPlugin);
    });
  });

  describe("useMathPlugin", () => {
    it("should return null when no plugins", () => {
      const { result } = renderHook(() => useMathPlugin(), {
        wrapper: wrapper(null),
      });
      expect(result.current).toBeNull();
    });

    it("should return math plugin when available", () => {
      const mathPlugin = { name: "math" };
      const { result } = renderHook(() => useMathPlugin(), {
        wrapper: wrapper({ math: mathPlugin }),
      });
      expect(result.current).toBe(mathPlugin);
    });
  });

  describe("useCjkPlugin", () => {
    it("should return null when no plugins", () => {
      const { result } = renderHook(() => useCjkPlugin(), {
        wrapper: wrapper(null),
      });
      expect(result.current).toBeNull();
    });

    it("should return cjk plugin when available", () => {
      const cjkPlugin = { name: "cjk" };
      const { result } = renderHook(() => useCjkPlugin(), {
        wrapper: wrapper({ cjk: cjkPlugin }),
      });
      expect(result.current).toBe(cjkPlugin);
    });
  });
});
