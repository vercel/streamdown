import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cn, save } from "../lib/utils";

// Setup global URL mocks before any tests run
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = vi.fn();
  URL.revokeObjectURL = vi.fn();
}

describe("cn utility", () => {
  it("should merge class names correctly", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should handle conditional classes", () => {
    const result = cn("base-class", false, "another-class");
    expect(result).toBe("base-class another-class");
  });

  it("should handle undefined and null values", () => {
    const result = cn("class-1", undefined, null, "class-2");
    expect(result).toBe("class-1 class-2");
  });

  it("should merge tailwind classes properly with conflict resolution", () => {
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });

  it("should merge complex tailwind classes", () => {
    const result = cn("text-gray-500 text-sm", "text-blue-600 text-lg");
    expect(result).toBe("text-blue-600 text-lg");
  });

  it("should handle arrays of classes", () => {
    const result = cn(["class-1", "class-2"], "class-3");
    expect(result).toBe("class-1 class-2 class-3");
  });

  it("should handle object syntax", () => {
    const result = cn({
      "active-class": true,
      "inactive-class": false,
      "another-active": true,
    });
    expect(result).toBe("active-class another-active");
  });

  it("should handle empty inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle mixed input types", () => {
    const result = cn(
      "base",
      ["array-class"],
      { "object-class": true },
      undefined,
      null,
      false,
      "final"
    );
    expect(result).toBe("base array-class object-class final");
  });

  it("should preserve non-conflicting tailwind classes", () => {
    const result = cn("mt-4 mb-4", "mr-2 ml-2");
    expect(result).toBe("mt-4 mb-4 mr-2 ml-2");
  });
});

describe("save utility", () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");
    revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    clickSpy = vi.fn();

    const mockAnchor = {
      href: "",
      download: "",
      click: clickSpy,
    } as unknown as HTMLAnchorElement;

    createElementSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValue(mockAnchor);
    appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation(() => mockAnchor);
    removeChildSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation(() => mockAnchor);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create and trigger download with string content", () => {
    const filename = "test.txt";
    const content = "Hello, World!";
    const mimeType = "text/plain";

    save(filename, content, mimeType);

    expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });

  it("should create and trigger download with Blob content", () => {
    const filename = "test.json";
    const content = new Blob(['{"key": "value"}'], {
      type: "application/json",
    });
    const mimeType = "application/json";

    save(filename, content, mimeType);

    expect(createObjectURLSpy).toHaveBeenCalledWith(content);
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });

  it("should set correct anchor attributes", () => {
    const filename = "document.pdf";
    const content = "PDF content";
    const mimeType = "application/pdf";

    save(filename, content, mimeType);

    const mockAnchor = createElementSpy.mock.results[0]
      .value as HTMLAnchorElement;
    expect(mockAnchor.href).toBe("blob:mock-url");
    expect(mockAnchor.download).toBe(filename);
  });

  it("should clean up after download", () => {
    const filename = "cleanup-test.txt";
    const content = "Test content";
    const mimeType = "text/plain";

    save(filename, content, mimeType);

    // Verify cleanup order: append -> click -> remove -> revoke
    const appendOrder = appendChildSpy.mock.invocationCallOrder[0];
    const clickOrder = clickSpy.mock.invocationCallOrder[0];
    const removeOrder = removeChildSpy.mock.invocationCallOrder[0];
    const revokeOrder = revokeObjectURLSpy.mock.invocationCallOrder[0];

    expect(appendOrder).toBeLessThan(clickOrder);
    expect(clickOrder).toBeLessThan(removeOrder);
    expect(removeOrder).toBeLessThan(revokeOrder);
  });
});
