import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { svgToPngBlob } from "../lib/mermaid/utils";

const BASE64_SVG_DATA_URL_REGEX = /^data:image\/svg\+xml;base64,/;

describe("svgToPngBlob", () => {
  let mockCanvas: any;
  let mockCtx: any;
  let mockImage: any;
  let originalImage: typeof Image;

  beforeEach(() => {
    mockCtx = {
      drawImage: vi.fn(),
    };

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn(),
    };

    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") {
        return mockCanvas;
      }
      return document.createElement(tag);
    });

    // Mock Image constructor properly
    mockImage = {
      width: 100,
      height: 50,
      crossOrigin: "",
      src: "",
      onload: null as any,
      onerror: null as any,
    };

    originalImage = globalThis.Image;
    globalThis.Image = class {
      constructor() {
        // biome-ignore lint/correctness/noConstructorReturn: need constructor mock to return shared mockImage
        return mockImage;
      }
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.Image = originalImage;
  });

  it("should convert SVG to PNG blob", async () => {
    const svgString = '<svg width="100" height="50"><text>Test</text></svg>';
    const mockBlob = new Blob(["png data"], { type: "image/png" });

    mockCanvas.toBlob.mockImplementation((cb: (blob: Blob | null) => void) => {
      cb(mockBlob);
    });

    const promise = svgToPngBlob(svgString);

    // Trigger image onload
    mockImage.onload();

    const result = await promise;
    expect(result).toBe(mockBlob);
    expect(mockCtx.drawImage).toHaveBeenCalled();
    expect(mockCanvas.width).toBe(500); // 100 * 5 (default scale)
    expect(mockCanvas.height).toBe(250); // 50 * 5 (default scale)
  });

  it("should use custom scale option", async () => {
    const svgString = '<svg width="100" height="50"><text>Test</text></svg>';
    const mockBlob = new Blob(["png data"], { type: "image/png" });

    mockCanvas.toBlob.mockImplementation((cb: (blob: Blob | null) => void) => {
      cb(mockBlob);
    });

    const promise = svgToPngBlob(svgString, { scale: 2 });

    mockImage.onload();

    const result = await promise;
    expect(result).toBe(mockBlob);
    expect(mockCanvas.width).toBe(200); // 100 * 2
    expect(mockCanvas.height).toBe(100); // 50 * 2
  });

  it("should reject when canvas context is null", async () => {
    const svgString = "<svg><text>Test</text></svg>";
    mockCanvas.getContext.mockReturnValue(null);

    const promise = svgToPngBlob(svgString);
    mockImage.onload();

    await expect(promise).rejects.toThrow(
      "Failed to create 2D canvas context for PNG export"
    );
  });

  it("should reject when toBlob returns null", async () => {
    const svgString = "<svg><text>Test</text></svg>";
    mockCanvas.toBlob.mockImplementation((cb: (blob: Blob | null) => void) => {
      cb(null);
    });

    const promise = svgToPngBlob(svgString);
    mockImage.onload();

    await expect(promise).rejects.toThrow("Failed to create PNG blob");
  });

  it("should reject when image fails to load", async () => {
    const svgString = "<svg><text>Test</text></svg>";

    const promise = svgToPngBlob(svgString);
    mockImage.onerror();

    await expect(promise).rejects.toThrow("Failed to load SVG image");
  });

  it("should set crossOrigin on image", () => {
    svgToPngBlob("<svg></svg>");
    expect(mockImage.crossOrigin).toBe("anonymous");
  });

  it("should encode SVG as base64 data URL", () => {
    svgToPngBlob("<svg><text>Hello</text></svg>");
    expect(mockImage.src).toMatch(BASE64_SVG_DATA_URL_REGEX);
  });
});
