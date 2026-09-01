import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import type { ExtraProps } from "../lib/markdown";

type FallbackProps = Record<string, unknown> & ExtraProps;

/**
 * A minimal pass-through renderer: renders the element using its own tag
 * name with any props passed down by hast-util-to-jsx-runtime.
 */
const PassThrough = ({ node, children, ...rest }: FallbackProps) =>
  createElement(
    node?.tagName ?? "span",
    { ...rest, "data-fallback": "true" },
    children as React.ReactNode
  );

describe("defaultComponent prop", () => {
  describe("allowedTags without explicit component", () => {
    it("uses defaultComponent for an allowedTags tag with no component entry", () => {
      const { container } = render(
        <Streamdown
          allowedTags={{ mention: [] }}
          defaultComponent={PassThrough}
          mode="static"
        >
          {"<mention>@alice</mention>"}
        </Streamdown>
      );

      // PassThrough renders the original tag; verify data-fallback attribute
      const el = container.querySelector("mention");
      expect(el).toBeTruthy();
      expect(el?.getAttribute("data-fallback")).toBe("true");
      expect(el?.textContent).toBe("@alice");
    });

    it("uses defaultComponent for multiple allowedTags without components", () => {
      const { container } = render(
        <Streamdown
          allowedTags={{ tag1: [], tag2: [] }}
          defaultComponent={PassThrough}
          mode="static"
        >
          {"<tag1>first</tag1> <tag2>second</tag2>"}
        </Streamdown>
      );

      const tag1 = container.querySelector("tag1");
      const tag2 = container.querySelector("tag2");
      expect(tag1?.getAttribute("data-fallback")).toBe("true");
      expect(tag2?.getAttribute("data-fallback")).toBe("true");
    });
  });

  describe("explicit components take precedence", () => {
    it("explicit component wins over defaultComponent", () => {
      const ExplicitTag = ({ children }: FallbackProps) => (
        <span data-explicit="true">{children as React.ReactNode}</span>
      );

      const { container } = render(
        <Streamdown
          allowedTags={{ mention: [] }}
          components={{ mention: ExplicitTag }}
          defaultComponent={PassThrough}
          mode="static"
        >
          {"<mention>@bob</mention>"}
        </Streamdown>
      );

      // Explicit component is used, not PassThrough
      const explicit = container.querySelector('[data-explicit="true"]');
      expect(explicit).toBeTruthy();
      expect(explicit?.textContent).toBe("@bob");

      // data-fallback should NOT be present
      const fallback = container.querySelector('[data-fallback="true"]');
      expect(fallback).toBeNull();
    });

    it("explicit p component overrides defaultComponent for paragraph", () => {
      const CustomP = ({ children }: React.PropsWithChildren) => (
        <p data-custom="true">{children}</p>
      );

      const { container } = render(
        <Streamdown
          components={{ p: CustomP as any }}
          defaultComponent={PassThrough}
          mode="static"
        >
          {"Hello world"}
        </Streamdown>
      );

      const p = container.querySelector('[data-custom="true"]');
      expect(p).toBeTruthy();
      // defaultComponent must not have been used for <p>
      const fallback = container.querySelector('[data-fallback="true"]');
      expect(fallback).toBeNull();
    });
  });

  describe("HTML tags not in defaultComponents", () => {
    it("uses defaultComponent for tags absent from the default map (e.g. <span>)", () => {
      const { container } = render(
        <Streamdown defaultComponent={PassThrough} mode="static">
          {"<span>inline span</span>"}
        </Streamdown>
      );

      const span = container.querySelector('[data-fallback="true"]');
      expect(span).toBeTruthy();
      expect(span?.textContent).toContain("inline span");
    });
  });

  describe("backward compatibility", () => {
    it("behaves identically when defaultComponent is not provided", () => {
      const { container: withProp } = render(
        <Streamdown mode="static">{"# Hello"}</Streamdown>
      );
      const { container: withoutProp } = render(
        <Streamdown mode="static">{"# Hello"}</Streamdown>
      );

      // Both should produce equivalent output
      expect(withProp.innerHTML).toBe(withoutProp.innerHTML);
      // defaultComponents Tailwind classes should still be applied
      const h1 = withProp.querySelector("h1");
      expect(h1).toBeTruthy();
      expect(h1?.className).toContain("font-semibold");
    });

    it("does not add data-fallback when defaultComponent is absent", () => {
      const { container } = render(
        <Streamdown mode="static">{"Hello **world**"}</Streamdown>
      );

      const fallback = container.querySelector('[data-fallback="true"]');
      expect(fallback).toBeNull();
    });
  });

  describe("streaming mode", () => {
    it("applies defaultComponent in streaming mode for allowedTags", () => {
      const { container } = render(
        <Streamdown
          allowedTags={{ chip: [] }}
          defaultComponent={PassThrough}
          mode="streaming"
        >
          {"<chip>label</chip>"}
        </Streamdown>
      );

      const chip = container.querySelector("chip");
      expect(chip).toBeTruthy();
      expect(chip?.getAttribute("data-fallback")).toBe("true");
    });
  });

  describe("node prop passthrough", () => {
    it("receives node with tagName in defaultComponent", () => {
      const tagNames: string[] = [];
      const Inspector = ({ node, children }: FallbackProps) => {
        if (node?.tagName) {
          tagNames.push(node.tagName);
        }
        return createElement(
          node?.tagName ?? "span",
          {},
          children as React.ReactNode
        );
      };

      render(
        <Streamdown
          allowedTags={{ badge: [] }}
          defaultComponent={Inspector}
          mode="static"
        >
          {"<badge>x</badge>"}
        </Streamdown>
      );

      expect(tagNames).toContain("badge");
    });
  });
});
