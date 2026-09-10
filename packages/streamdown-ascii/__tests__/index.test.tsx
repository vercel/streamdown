import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ascii, createAsciiPlugin } from "../index";

describe("ascii", () => {
  describe("plugin properties", () => {
    it("binds the default languages", () => {
      expect(ascii.language).toEqual(["ascii", "diagram", "chart"]);
    });

    it("exposes a component", () => {
      expect(typeof ascii.component).toBe("function");
    });
  });
});

describe("createAsciiPlugin", () => {
  it("creates a plugin with default options", () => {
    const plugin = createAsciiPlugin();
    expect(plugin.language).toEqual(["ascii", "diagram", "chart"]);
    expect(typeof plugin.component).toBe("function");
  });

  it("binds custom languages", () => {
    const plugin = createAsciiPlugin({ languages: ["box-drawing"] });
    expect(plugin.language).toEqual(["box-drawing"]);
  });

  it("creates independent plugin instances", () => {
    const plugin1 = createAsciiPlugin({ languages: ["ascii"] });
    const plugin2 = createAsciiPlugin({ languages: ["diagram"] });

    expect(plugin1.language).toEqual(["ascii"]);
    expect(plugin2.language).toEqual(["diagram"]);
  });

  describe("rendered output", () => {
    const code = "┌─────┐\n│ box │\n└─────┘";

    it("renders a single <pre> element containing exactly one text child", () => {
      const plugin = createAsciiPlugin();
      const Component = plugin.component;
      const { container } = render(
        <Component code={code} isIncomplete={false} language="ascii" />
      );

      const pre = container.querySelector("pre");
      expect(pre).toBeTruthy();
      expect(pre?.childNodes.length).toBe(1);
      expect(pre?.childNodes[0]?.nodeType).toBe(Node.TEXT_NODE);
      expect(pre?.textContent).toBe(code);
    });

    it("applies ligature/white-space/overflow-safe styling", () => {
      const plugin = createAsciiPlugin();
      const Component = plugin.component;
      const { container } = render(
        <Component code={code} isIncomplete={false} language="ascii" />
      );

      const pre = container.querySelector("pre");
      expect(pre?.style.whiteSpace).toBe("pre");
      expect(pre?.style.overflowX).toBe("auto");
      expect(pre?.style.fontVariantLigatures).toBe("none");
      expect(pre?.style.fontFeatureSettings).toBe('"liga" 0, "calt" 0');
      expect(pre?.style.fontFamily).toContain("ui-monospace");
    });

    it("keeps the tree shape stable across isIncomplete true -> false", () => {
      const plugin = createAsciiPlugin();
      const Component = plugin.component;
      const { container, rerender } = render(
        <Component code={code} isIncomplete={true} language="ascii" />
      );

      const preBefore = container.querySelector("pre");
      expect(preBefore?.getAttribute("data-incomplete")).toBe("true");
      expect(preBefore?.childNodes.length).toBe(1);

      rerender(<Component code={code} isIncomplete={false} language="ascii" />);

      const preAfter = container.querySelector("pre");
      expect(preAfter).toBe(preBefore);
      expect(preAfter?.getAttribute("data-incomplete")).toBe("false");
      expect(preAfter?.childNodes.length).toBe(1);
    });

    it("does not throw when isIncomplete is true with partial content", () => {
      const plugin = createAsciiPlugin();
      const Component = plugin.component;
      expect(() =>
        render(
          <Component code={"┌─────"} isIncomplete={true} language="ascii" />
        )
      ).not.toThrow();
    });

    it("applies a custom className", () => {
      const plugin = createAsciiPlugin({ className: "my-ascii-block" });
      const Component = plugin.component;
      const { container } = render(
        <Component code={code} isIncomplete={false} language="ascii" />
      );

      const pre = container.querySelector("pre");
      expect(pre?.className).toBe("my-ascii-block");
    });

    it("applies a custom fontFamily", () => {
      const plugin = createAsciiPlugin({ fontFamily: "Menlo, monospace" });
      const Component = plugin.component;
      const { container } = render(
        <Component code={code} isIncomplete={false} language="ascii" />
      );

      const pre = container.querySelector("pre");
      expect(pre?.style.fontFamily).toBe("Menlo, monospace");
    });
  });
});
