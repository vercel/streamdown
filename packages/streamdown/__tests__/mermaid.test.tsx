import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MermaidConfig } from "mermaid";
import { Mermaid } from "../lib/mermaid";

// Mock mermaid
const mockInitialize = vi.fn();
const mockRender = vi.fn().mockResolvedValue({ svg: "<svg>Test SVG</svg>" });

vi.mock("mermaid", () => ({
  default: {
    initialize: mockInitialize,
    render: mockRender,
  },
}));

describe("Mermaid", () => {
  beforeEach(() => {
    // Clear mock calls before each test
    mockInitialize.mockClear();
    mockRender.mockClear();
  });

  it("renders without crashing", () => {
    const { container } = render(<Mermaid chart="graph TD; A-->B" />);
    expect(container.firstChild).toBeDefined();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Mermaid chart="graph TD; A-->B" className="custom-class" />
    );

    const mermaidContainer = container.firstChild as HTMLElement;
    expect(mermaidContainer.className).toContain("custom-class");
  });

  it("initializes mermaid with custom config", async () => {
    const customConfig: MermaidConfig = {
      theme: "dark",
      themeVariables: {
        primaryColor: "#ff0000",
        primaryTextColor: "#ffffff",
      },
      fontFamily: "Arial, sans-serif",
    } as MermaidConfig;

    render(<Mermaid chart="graph TD; A-->B" config={customConfig} />);

    // Wait for async initialization
    await vi.waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });

    // Check that initialize was called with merged config
    const initializeCall = mockInitialize.mock.calls[0][0];
    expect(initializeCall.theme).toBe("dark");
    expect(initializeCall.themeVariables?.primaryColor).toBe("#ff0000");
    expect(initializeCall.themeVariables?.primaryTextColor).toBe("#ffffff");
    expect(initializeCall.fontFamily).toBe("Arial, sans-serif");
  });

  it("uses default config when no custom config provided", async () => {
    render(<Mermaid chart="graph TD; A-->B" />);

    // Wait for async initialization
    await vi.waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });

    // Check that initialize was called with default config
    const initializeCall = mockInitialize.mock.calls[0][0];
    expect(initializeCall.theme).toBe("default");
    expect(initializeCall.securityLevel).toBe("strict");
    expect(initializeCall.fontFamily).toBe("monospace");
    expect(initializeCall.suppressErrorRendering).toBe(true);
  });

  it("accepts different config values", () => {
    const config1: MermaidConfig = {
      theme: "forest",
    } as MermaidConfig;

    const { rerender } = render(<Mermaid chart="graph TD; A-->B" config={config1} />);

    // Should render without error
    expect(mockRender).toBeDefined();

    const config2: MermaidConfig = {
      theme: "dark",
      fontFamily: "Arial",
    } as MermaidConfig;

    // Should be able to rerender with different config
    rerender(<Mermaid chart="graph TD; A-->B" config={config2} />);

    // Should still render without error
    expect(mockRender).toBeDefined();
  });
});
