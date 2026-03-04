import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageComponent } from "../lib/image";

// Setup global URL mocks before any tests run
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = vi.fn();
  URL.revokeObjectURL = vi.fn();
}

// Mock the save utility
vi.mock("../lib/utils", async () => {
  const actual = await vi.importActual("../lib/utils");
  return {
    ...actual,
    save: vi.fn(),
  };
});

describe("ImageComponent", () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = vi.fn();

    // Mock console.error to suppress error logs in tests
    vi.spyOn(console, "error").mockImplementation(() => {
      // Intentionally empty to suppress console output during tests
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render null when src is not provided", () => {
    const { container } = render(<ImageComponent node={null as any} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render image with src and alt", () => {
    const { container } = render(
      <ImageComponent
        alt="Test image"
        node={null as any}
        src="https://example.com/image.png"
      />
    );

    const img = container.querySelector('img[data-streamdown="image"]');
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("https://example.com/image.png");
    expect(img?.getAttribute("alt")).toBe("Test image");
  });

  it("should render wrapper with correct classes", () => {
    const { container } = render(
      <ImageComponent
        alt="Test"
        node={null as any}
        src="https://example.com/image.png"
      />
    );

    const wrapper = container.querySelector(
      '[data-streamdown="image-wrapper"]'
    );
    expect(wrapper).toBeTruthy();
    expect(wrapper?.className).toContain("group");
    expect(wrapper?.className).toContain("relative");
  });

  it("should render download button", () => {
    const { container } = render(
      <ImageComponent
        alt="Test"
        node={null as any}
        src="https://example.com/image.png"
      />
    );

    const img = container.querySelector('img[data-streamdown="image"]');
    if (img) {
      fireEvent.load(img);
    }

    const button = container.querySelector('button[title="Download image"]');
    expect(button).toBeTruthy();
  });

  it("should apply custom className to image", () => {
    const { container } = render(
      <ImageComponent
        alt="Test"
        className="custom-class"
        node={null as any}
        src="https://example.com/image.png"
      />
    );

    const img = container.querySelector('img[data-streamdown="image"]');
    expect(img?.className).toContain("custom-class");
  });

  it("should download image with extension from URL", async () => {
    const { save } = await import("../lib/utils");
    const mockBlob = new Blob(["image data"], { type: "image/png" });

    (global.fetch as any).mockResolvedValueOnce({
      blob: async () => mockBlob,
    });

    const { container } = render(
      <ImageComponent
        alt="Test"
        node={null as any}
        src="https://example.com/image.png"
      />
    );

    const img = container.querySelector('img[data-streamdown="image"]');
    if (img) {
      fireEvent.load(img);
    }

    const button = container.querySelector('button[title="Download image"]');
    expect(button).toBeTruthy();
    if (button) {
      fireEvent.click(button);
    }

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith("image.png", mockBlob, "image/png");
    });
  });

  it("should download image with extension from blob type when URL has no extension", async () => {
    const { save } = await import("../lib/utils");
    const mockBlob = new Blob(["image data"], { type: "image/jpeg" });

    (global.fetch as any).mockResolvedValueOnce({
      blob: async () => mockBlob,
    });

    const { container } = render(
      <ImageComponent
        alt="My Image"
        node={null as any}
        src="https://example.com/noextension"
      />
    );

    const img = container.querySelector('img[data-streamdown="image"]');
    if (img) {
      fireEvent.load(img);
    }

    const button = container.querySelector('button[title="Download image"]');
    expect(button).toBeTruthy();
    if (button) {
      fireEvent.click(button);
    }

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith("My Image.jpg", mockBlob, "image/jpeg");
    });
  });

  it("should use default extension when blob type is unknown", async () => {
    const { save } = await import("../lib/utils");
    const mockBlob = new Blob(["image data"], {
      type: "application/octet-stream",
    });

    (global.fetch as any).mockResolvedValueOnce({
      blob: async () => mockBlob,
    });

    const { container } = render(
      <ImageComponent
        alt="Test"
        node={null as any}
        src="https://example.com/noext"
      />
    );

    const img = container.querySelector('img[data-streamdown="image"]');
    if (img) {
      fireEvent.load(img);
    }

    const button = container.querySelector('button[title="Download image"]');
    expect(button).toBeTruthy();
    if (button) {
      fireEvent.click(button);
    }

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith(
        "Test.png",
        mockBlob,
        "application/octet-stream"
      );
    });
  });

  it("should handle different image types from blob", async () => {
    const { save } = await import("../lib/utils");

    const testCases = [
      { type: "image/svg+xml", extension: "svg" },
      { type: "image/gif", extension: "gif" },
      { type: "image/webp", extension: "webp" },
      { type: "image/png", extension: "png" },
    ];

    for (const { type, extension } of testCases) {
      const mockBlob = new Blob(["data"], { type });
      (global.fetch as any).mockResolvedValueOnce({
        blob: async () => mockBlob,
      });

      const { container, unmount } = render(
        <ImageComponent
          alt="Test"
          node={null as any}
          src="https://example.com/test"
        />
      );

      const img = container.querySelector('img[data-streamdown="image"]');
      if (img) {
        fireEvent.load(img);
      }

      const button = container.querySelector('button[title="Download image"]');
      expect(button).toBeTruthy();
      if (button) {
        fireEvent.click(button);
      }

      await waitFor(() => {
        expect(save).toHaveBeenCalledWith(`Test.${extension}`, mockBlob, type);
      });

      unmount();
      vi.clearAllMocks();
    }
  });

  it("should use alt text as filename when URL has no name", async () => {
    const { save } = await import("../lib/utils");
    const mockBlob = new Blob(["data"], { type: "image/png" });

    (global.fetch as any).mockResolvedValueOnce({
      blob: async () => mockBlob,
    });

    const { container } = render(
      <ImageComponent
        alt="My Custom Name"
        node={null as any}
        src="https://example.com/"
      />
    );

    const img = container.querySelector('img[data-streamdown="image"]');
    if (img) {
      fireEvent.load(img);
    }

    const button = container.querySelector('button[title="Download image"]');
    expect(button).toBeTruthy();
    if (button) {
      fireEvent.click(button);
    }

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith(
        "My Custom Name.png",
        mockBlob,
        "image/png"
      );
    });
  });

  it("should use 'image' as default filename when no alt or filename available", async () => {
    const { save } = await import("../lib/utils");
    const mockBlob = new Blob(["data"], { type: "image/png" });

    (global.fetch as any).mockResolvedValueOnce({
      blob: async () => mockBlob,
    });

    const { container } = render(
      <ImageComponent node={null as any} src="https://example.com/" />
    );

    const img = container.querySelector('img[data-streamdown="image"]');
    if (img) {
      fireEvent.load(img);
    }

    const button = container.querySelector('button[title="Download image"]');
    expect(button).toBeTruthy();
    if (button) {
      fireEvent.click(button);
    }

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith("image.png", mockBlob, "image/png");
    });
  });

  it("should fallback to window.open when fetch fails (e.g., CORS error)", async () => {
    const mockWindowOpen = vi.fn();
    global.window.open = mockWindowOpen;

    (global.fetch as any).mockRejectedValueOnce(new Error("CORS error"));

    const { container } = render(
      <ImageComponent
        alt="Test"
        node={null as any}
        src="https://example.com/image.png"
      />
    );

    const img = container.querySelector('img[data-streamdown="image"]');
    if (img) {
      fireEvent.load(img);
    }

    const button = container.querySelector('button[title="Download image"]');
    expect(button).toBeTruthy();
    if (button) {
      fireEvent.click(button);
    }

    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledWith(
        "https://example.com/image.png",
        "_blank"
      );
    });
  });

  it("should not attempt download when src is undefined in download handler", async () => {
    const { save } = await import("../lib/utils");

    const { container, rerender } = render(
      <ImageComponent
        alt="Test"
        node={null as any}
        src="https://example.com/image.png"
      />
    );

    // Rerender without src
    rerender(<ImageComponent node={null as any} />);

    // Since component returns null without src, there's no button to click
    const button = container.querySelector('button[title="Download image"]');
    expect(button).toBeFalsy();
    expect(save).not.toHaveBeenCalled();
  });

  it("should remove extension from alt text when used as filename", async () => {
    const { save } = await import("../lib/utils");
    const mockBlob = new Blob(["data"], { type: "image/png" });

    (global.fetch as any).mockResolvedValueOnce({
      blob: async () => mockBlob,
    });

    const { container } = render(
      <ImageComponent
        alt="My Image.jpg"
        node={null as any}
        src="https://example.com/"
      />
    );

    const img = container.querySelector('img[data-streamdown="image"]');
    if (img) {
      fireEvent.load(img);
    }

    const button = container.querySelector('button[title="Download image"]');
    expect(button).toBeTruthy();
    if (button) {
      fireEvent.click(button);
    }

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith("My Image.png", mockBlob, "image/png");
    });
  });

  it("should pass through additional props to img element", () => {
    const { container } = render(
      <ImageComponent
        alt="Test"
        data-testid="custom-image"
        loading="lazy"
        node={null as any}
        src="https://example.com/image.png"
        title="Test Title"
      />
    );

    const img = container.querySelector('img[data-streamdown="image"]');
    expect(img?.getAttribute("title")).toBe("Test Title");
    expect(img?.getAttribute("loading")).toBe("lazy");
    expect(img?.getAttribute("data-testid")).toBe("custom-image");
  });
});
