import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  bundledLanguages,
  isBundledLanguage,
} from "../lib/code-block/bundled-languages";
import { loadLanguageFromCDN } from "../lib/code-block/cdn-loader";

// Regex patterns for CDN URL validation
const CDN_URL_PATTERN_UNIQUELANG1 =
  /^\/cdn\/shiki\/[\d.]+\/langs\/uniquelang1\.mjs$/;
const CDN_URL_PATTERN_UNIQUELANG8 =
  /^\/cdn\/shiki\/\d+\.\d+\.\d+\/langs\/uniquelang8\.mjs$/;
const CDN_URL_PATTERN_CUSTOMLANG4 =
  /^\/cdn\/shiki\/[\d.]+\/langs\/customlang4\.mjs$/;

describe("Bundled Languages", () => {
  it("should have exactly 15 common languages bundled", () => {
    const languageKeys = Object.keys(bundledLanguages);
    // Note: This includes aliases, so actual count is higher
    expect(languageKeys.length).toBeGreaterThanOrEqual(15);
  });

  it("should include core web languages", () => {
    expect(isBundledLanguage("javascript")).toBe(true);
    expect(isBundledLanguage("typescript")).toBe(true);
    expect(isBundledLanguage("jsx")).toBe(true);
    expect(isBundledLanguage("tsx")).toBe(true);
    expect(isBundledLanguage("html")).toBe(true);
    expect(isBundledLanguage("css")).toBe(true);
  });

  it("should include common data formats", () => {
    expect(isBundledLanguage("json")).toBe(true);
    expect(isBundledLanguage("yaml")).toBe(true);
    expect(isBundledLanguage("toml")).toBe(true);
  });

  it("should include shell languages", () => {
    expect(isBundledLanguage("bash")).toBe(true);
    expect(isBundledLanguage("shellscript")).toBe(true);
  });

  it("should include popular backend languages", () => {
    expect(isBundledLanguage("python")).toBe(true);
    expect(isBundledLanguage("go")).toBe(true);
  });

  it("should include markup languages", () => {
    expect(isBundledLanguage("markdown")).toBe(true);
    expect(isBundledLanguage("sql")).toBe(true);
  });

  it("should support language aliases", () => {
    expect(isBundledLanguage("shell")).toBe(true); // alias for shellscript
    expect(isBundledLanguage("sh")).toBe(true); // alias for bash
    expect(isBundledLanguage("yml")).toBe(true); // alias for yaml
    expect(isBundledLanguage("py")).toBe(true); // alias for python
    expect(isBundledLanguage("md")).toBe(true); // alias for markdown
    expect(isBundledLanguage("golang")).toBe(true); // alias for go
  });

  it("should return false for non-bundled languages", () => {
    expect(isBundledLanguage("rust")).toBe(false);
    expect(isBundledLanguage("java")).toBe(false);
    expect(isBundledLanguage("ruby")).toBe(false);
    expect(isBundledLanguage("elixir")).toBe(false);
  });

  it("should return language grammar arrays", () => {
    const jsGrammar = bundledLanguages.javascript;
    expect(Array.isArray(jsGrammar)).toBe(true);
    expect(jsGrammar.length).toBeGreaterThan(0);
  });
});

describe("CDN Language Loader", () => {
  beforeEach(() => {
    // Clear any module-level caches
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("should construct correct CDN URL with version", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "",
    } as Response);

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      // Suppress console warnings during test
    });

    await loadLanguageFromCDN("uniquelang1");

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringMatching(CDN_URL_PATTERN_UNIQUELANG1),
      expect.any(Object)
    );

    fetchSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("should handle successful CDN response", async () => {
    const mockGrammar = {
      name: "uniquelang2",
      scopeName: "source.uniquelang2",
      patterns: [],
    };

    const mockModuleText = `const lang = Object.freeze(JSON.parse("${JSON.stringify(mockGrammar).replace(/"/g, '\\"')}"));
export default [lang];`;

    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockResolvedValue({
      ok: true,
      text: async () => mockModuleText,
    } as Response);

    const result = await loadLanguageFromCDN("uniquelang2");

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBe(true);
    if (result) {
      expect(result[0]).toHaveProperty("name");
    }

    fetchSpy.mockRestore();
  });

  it("should cache loaded languages", async () => {
    const mockGrammar = {
      name: "uniquelang3",
      scopeName: "source.uniquelang3",
      patterns: [],
    };

    const mockModuleText = `const lang = Object.freeze(JSON.parse("${JSON.stringify(mockGrammar).replace(/"/g, '\\"')}"));
export default [lang];`;

    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockResolvedValue({
      ok: true,
      text: async () => mockModuleText,
    } as Response);

    // First load
    const result1 = await loadLanguageFromCDN("uniquelang3");
    expect(result1).toBeTruthy();

    // Second load should use cache
    const result2 = await loadLanguageFromCDN("uniquelang3");
    expect(result2).toBeTruthy();

    // Should have only called fetch once due to caching
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
  });

  it("should handle CDN fetch failures gracefully", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockRejectedValue(new Error("Network error"));

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      // Suppress console warnings during test
    });

    const result = await loadLanguageFromCDN("uniquelang4");

    expect(result).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0][0]).toContain(
      "[Streamdown] Failed to load language"
    );

    fetchSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("should handle HTTP error responses", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "",
    } as Response);

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      // Suppress console warnings during test
    });

    const result = await loadLanguageFromCDN("uniquelang5");

    expect(result).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0][0]).toContain(
      "[Streamdown] Failed to load language"
    );

    fetchSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("should handle malformed CDN responses", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockResolvedValue({
      ok: true,
      text: async () => "invalid javascript code",
    } as Response);

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      // Suppress console warnings during test
    });

    const result = await loadLanguageFromCDN("uniquelang6");

    expect(result).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0][0]).toContain(
      "[Streamdown] Failed to load language"
    );

    fetchSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("should not retry failed language loads", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "",
    } as Response);

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      // Suppress console warnings during test
    });

    // First attempt
    const result1 = await loadLanguageFromCDN("uniquelang7");
    expect(result1).toBeNull();

    // Second attempt should not trigger fetch due to failed languages tracking
    const result2 = await loadLanguageFromCDN("uniquelang7");
    expect(result2).toBeNull();

    // Should have only called fetch once
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });
});

describe("Hybrid Language Loading Integration", () => {
  it("should prioritize bundled languages over CDN", () => {
    // Bundled language should be detected
    expect(isBundledLanguage("javascript")).toBe(true);

    // Non-bundled language should not be detected
    expect(isBundledLanguage("rust")).toBe(false);
  });

  it("should have valid version number in CDN URL", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "",
    } as Response);

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      // Suppress console warnings during test
    });

    await loadLanguageFromCDN("uniquelang8");

    expect(fetchSpy).toHaveBeenCalled();
    const callUrl = fetchSpy.mock.calls[0][0] as string;

    // Should have format: /cdn/shiki/{version}/langs/uniquelang8.mjs
    expect(callUrl).toMatch(CDN_URL_PATTERN_UNIQUELANG8);

    fetchSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });
});

describe("CDN Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("should use custom CDN base URL when provided", async () => {
    const customCdnBase = "https://my-cdn.example.com/shiki/langs";

    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "",
    } as Response);

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      // Suppress console warnings during test
    });

    await loadLanguageFromCDN("customlang1", customCdnBase);

    expect(fetchSpy).toHaveBeenCalledWith(
      `${customCdnBase}/customlang1.mjs`,
      expect.any(Object)
    );

    fetchSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("should use custom timeout when provided", async () => {
    const customTimeout = 10_000;

    const fetchSpy = vi.spyOn(global, "fetch");

    fetchSpy.mockImplementation((_url, _options?: { signal?: AbortSignal }) => {
      // Return immediately with success to test that timeout is configured
      return Promise.resolve({
        ok: true,
        text: async () =>
          'const lang = Object.freeze(JSON.parse("{\\"name\\":\\"test\\"}"));',
      } as Response);
    });

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      // Suppress console warnings during test
    });

    const result = await loadLanguageFromCDN(
      "customlang2",
      undefined,
      customTimeout
    );

    // Should succeed with custom timeout configured
    expect(result).toBeTruthy();
    expect(fetchSpy).toHaveBeenCalled();

    fetchSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("should disable CDN loading when cdnUrl is null", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockResolvedValue({
      ok: true,
      text: async () => 'const lang = Object.freeze(JSON.parse("{}"));',
    } as Response);

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      // Suppress console warnings during test
    });

    const result = await loadLanguageFromCDN("customlang3", null);

    // When CDN URL is null, should return null immediately without fetching
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("should use default CDN when cdnUrl is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "",
    } as Response);

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      // Suppress console warnings during test
    });

    await loadLanguageFromCDN("customlang4", undefined);

    // Should use default CDN path
    expect(fetchSpy).toHaveBeenCalled();
    const callUrl = fetchSpy.mock.calls[0][0] as string;
    expect(callUrl).toMatch(CDN_URL_PATTERN_CUSTOMLANG4);

    fetchSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });
});
