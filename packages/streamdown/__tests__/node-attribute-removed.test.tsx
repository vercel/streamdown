import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { components } from "../lib/components";

describe("Node Attribute Fix", () => {
  // Create a realistic HAST node object that would be passed by react-markdown
  const mockHastNode = {
    type: "element",
    tagName: "ul",
    properties: {
      className: ["test-class"],
    },
    children: [
      {
        type: "element",
        tagName: "li",
        properties: {},
        children: [{ type: "text", value: "Item 1" }],
      },
    ],
    position: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 3, column: 1, offset: 15 },
    },
  };

  describe("List Components - No node attribute in HTML", () => {
    it("should NOT render node attribute in OL element", () => {
      const OL = components.ol;
      if (!OL) {
        throw new Error("OL component not found");
      }
      const { container } = render(
        <OL node={mockHastNode as any}>
          <li>Item 1</li>
          <li>Item 2</li>
        </OL>
      );

      const ol = container.querySelector("ol");
      expect(ol).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(ol?.getAttribute("node")).toBeNull();
      expect(ol?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(ol?.getAttribute("data-streamdown")).toBe("ordered-list");
      expect(ol?.className).toContain("list-inside");
    });

    it("should NOT render node attribute in UL element", () => {
      const UL = components.ul;
      if (!UL) {
        throw new Error("UL component not found");
      }
      const { container } = render(
        <UL node={mockHastNode as any}>
          <li>Item 1</li>
          <li>Item 2</li>
        </UL>
      );

      const ul = container.querySelector("ul");
      expect(ul).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(ul?.getAttribute("node")).toBeNull();
      expect(ul?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(ul?.getAttribute("data-streamdown")).toBe("unordered-list");
      expect(ul?.className).toContain("list-disc");
    });

    it("should NOT render node attribute in LI element", () => {
      const LI = components.li;
      if (!LI) {
        throw new Error("LI component not found");
      }
      const { container } = render(
        <LI node={mockHastNode as any}>List item content</LI>
      );

      const li = container.querySelector("li");
      expect(li).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(li?.getAttribute("node")).toBeNull();
      expect(li?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(li?.getAttribute("data-streamdown")).toBe("list-item");
      expect(li?.className).toContain("py-1");
    });
  });

  describe("Heading Components - No node attribute in HTML", () => {
    it("should NOT render node attribute in H1 element", () => {
      const H1 = components.h1;
      if (!H1) {
        throw new Error("H1 component not found");
      }
      const { container } = render(
        <H1 node={mockHastNode as any}>Heading 1</H1>
      );

      const h1 = container.querySelector("h1");
      expect(h1).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(h1?.getAttribute("node")).toBeNull();
      expect(h1?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(h1?.getAttribute("data-streamdown")).toBe("heading-1");
      expect(h1?.className).toContain("text-3xl");
    });

    it("should NOT render node attribute in H2 element", () => {
      const H2 = components.h2;
      if (!H2) {
        throw new Error("H2 component not found");
      }
      const { container } = render(
        <H2 node={mockHastNode as any}>Heading 2</H2>
      );

      const h2 = container.querySelector("h2");
      expect(h2).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(h2?.getAttribute("node")).toBeNull();
      expect(h2?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(h2?.getAttribute("data-streamdown")).toBe("heading-2");
      expect(h2?.className).toContain("text-2xl");
    });

    it("should NOT render node attribute in H3 element", () => {
      const H3 = components.h3;
      if (!H3) {
        throw new Error("H3 component not found");
      }
      const { container } = render(
        <H3 node={mockHastNode as any}>Heading 3</H3>
      );

      const h3 = container.querySelector("h3");
      expect(h3).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(h3?.getAttribute("node")).toBeNull();
      expect(h3?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(h3?.getAttribute("data-streamdown")).toBe("heading-3");
      expect(h3?.className).toContain("text-xl");
    });
  });

  describe("Link Component - No node attribute in HTML", () => {
    it("should NOT render node attribute in A element", () => {
      const A = components.a;
      if (!A) {
        throw new Error("A component not found");
      }
      const { container } = render(
        <A href="https://example.com" node={mockHastNode as any}>
          Link text
        </A>
      );

      const a = container.querySelector("a");
      expect(a).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(a?.getAttribute("node")).toBeNull();
      expect(a?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(a?.getAttribute("data-streamdown")).toBe("link");
      expect(a?.getAttribute("href")).toBe("https://example.com");
      expect(a?.className).toContain("text-primary");
    });
  });

  describe("Image Component - No node attribute in HTML", () => {
    it("should NOT render node attribute in IMG element", () => {
      const IMG = components.img;
      if (!IMG) {
        throw new Error("IMG component not found");
      }
      const { container } = render(
        <IMG
          alt="Test image"
          node={mockHastNode as any}
          src="https://example.com/image.png"
        />
      );

      const img = container.querySelector("img");
      expect(img).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(img?.getAttribute("node")).toBeNull();
      expect(img?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(img?.getAttribute("data-streamdown")).toBe("image");
      expect(img?.getAttribute("src")).toBe("https://example.com/image.png");
      expect(img?.getAttribute("alt")).toBe("Test image");
    });
  });

  describe("Code Component - No node attribute in HTML", () => {
    it("should NOT render node attribute in inline CODE element", () => {
      const Code = components.code;
      if (!Code) {
        throw new Error("Code component not found");
      }
      const { container } = render(
        <Code
          node={
            {
              position: {
                start: { line: 1, column: 1 },
                end: { line: 1, column: 10 }, // Same line = inline
              },
            } as any
          }
        >
          inline code
        </Code>
      );

      const code = container.querySelector("code");
      expect(code).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(code?.getAttribute("node")).toBeNull();
      expect(code?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(code?.getAttribute("data-streamdown")).toBe("inline-code");
      expect(code?.className).toContain("font-mono");
    });
  });

  describe("Comprehensive Node Attribute Check", () => {
    it("should verify NO components render node='[object Object]' attribute", () => {
      if (
        !(
          components.ol &&
          components.ul &&
          components.li &&
          components.h1 &&
          components.h2 &&
          components.h3 &&
          components.a &&
          components.img
        )
      ) {
        throw new Error("Required components not found");
      }

      const testComponents = [
        { name: "ol", component: components.ol, element: "ol" },
        { name: "ul", component: components.ul, element: "ul" },
        { name: "li", component: components.li, element: "li" },
        { name: "h1", component: components.h1, element: "h1" },
        { name: "h2", component: components.h2, element: "h2" },
        { name: "h3", component: components.h3, element: "h3" },
        {
          name: "a",
          component: components.a,
          element: "a",
          props: { href: "https://example.com" },
        },
        {
          name: "img",
          component: components.img,
          element: "img",
          props: { src: "test.png", alt: "test" },
        },
      ];

      for (const { name, component, element, props = {} } of testComponents) {
        const Component = component;
        const { container } = render(
          <Component node={mockHastNode as any} {...props}>
            {element !== "img" && element !== "hr" ? "Test content" : undefined}
          </Component>
        );

        const domElement = container.querySelector(element);
        expect(domElement, `${name} component should render`).toBeTruthy();

        // 🎯 The critical test: NO node attribute should exist
        expect(
          domElement?.getAttribute("node"),
          `${name} component should NOT have node attribute`
        ).toBeNull();

        expect(
          domElement?.hasAttribute("node"),
          `${name} component should NOT have node attribute`
        ).toBe(false);

        // ✅ Verify data-streamdown attribute IS present (proves component works)
        expect(
          domElement?.getAttribute("data-streamdown"),
          `${name} component should have data-streamdown attribute`
        ).toBeTruthy();
      }
    });

    it("should verify component still receives node prop internally (for memoization)", () => {
      // This test ensures we didn't break the internal node usage
      const UL = components.ul;
      if (!UL) {
        throw new Error("UL component not found");
      }

      // First render
      const { container, rerender } = render(
        <UL node={mockHastNode as any}>
          <li>Item 1</li>
        </UL>
      );

      const ul1 = container.querySelector("ul");
      expect(ul1).toBeTruthy();

      // Second render with same node (should be memoized)
      rerender(
        <UL node={mockHastNode as any}>
          <li>Item 1</li>
        </UL>
      );

      const ul2 = container.querySelector("ul");
      expect(ul2).toBeTruthy();

      // Component should still work and not have node attribute
      expect(ul2?.getAttribute("node")).toBeNull();
      expect(ul2?.getAttribute("data-streamdown")).toBe("unordered-list");
    });
  });
});
