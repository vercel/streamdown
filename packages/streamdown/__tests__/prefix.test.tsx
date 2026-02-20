import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { createCn, prefixClasses } from "../lib/utils";

describe("prefixClasses", () => {
  it("should prepend prefix to each class", () => {
    expect(prefixClasses("tw", "flex items-center")).toBe(
      "tw:flex tw:items-center"
    );
  });

  it("should handle dark: variants", () => {
    expect(prefixClasses("tw", "dark:bg-red-500")).toBe("tw:dark:bg-red-500");
  });

  it("should handle arbitrary values", () => {
    expect(prefixClasses("tw", "[&>p]:inline")).toBe("tw:[&>p]:inline");
  });

  it("should handle empty class string", () => {
    expect(prefixClasses("tw", "")).toBe("");
  });

  it("should handle empty prefix", () => {
    expect(prefixClasses("", "flex")).toBe("flex");
  });

  it("should handle multiple spaces", () => {
    expect(prefixClasses("tw", "  flex   items-center  ")).toBe(
      "tw:flex tw:items-center"
    );
  });

  it("should handle CSS custom property classes", () => {
    expect(prefixClasses("tw", "bg-[var(--shiki-dark-bg)]")).toBe(
      "tw:bg-[var(--shiki-dark-bg)]"
    );
  });

  it("should handle responsive variants", () => {
    expect(prefixClasses("tw", "sm:flex md:hidden")).toBe(
      "tw:sm:flex tw:md:hidden"
    );
  });

  it("should not double-prefix classes that are already prefixed", () => {
    expect(prefixClasses("tw", "tw:flex tw:items-center")).toBe(
      "tw:flex tw:items-center"
    );
  });

  it("should not double-prefix mixed already-prefixed and unprefixed classes", () => {
    expect(prefixClasses("tw", "tw:flex items-center")).toBe(
      "tw:flex tw:items-center"
    );
  });
});

describe("createCn", () => {
  it("should return standard cn when no prefix", () => {
    const cn = createCn();
    expect(cn("flex", "items-center")).toBe("flex items-center");
  });

  it("should return standard cn for empty prefix", () => {
    const cn = createCn("");
    expect(cn("flex", "items-center")).toBe("flex items-center");
  });

  it("should return prefixed cn when prefix is set", () => {
    const cn = createCn("tw");
    expect(cn("flex", "items-center")).toBe("tw:flex tw:items-center");
  });

  it("should resolve conflicts before prefixing", () => {
    const cn = createCn("tw");
    // twMerge resolves p-4 + p-2 -> p-2, then prefix is applied
    expect(cn("p-4", "p-2")).toBe("tw:p-2");
  });

  it("should handle conditional classes", () => {
    const cn = createCn("tw");
    expect(cn("flex", false && "hidden", "items-center")).toBe(
      "tw:flex tw:items-center"
    );
  });
});

describe("Streamdown with prefix", () => {
  it("should render with prefixed classes", () => {
    const { container } = render(
      <Streamdown prefix="tw" mode="static">
        **bold text**
      </Streamdown>
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toMatch(/tw:/);
  });

  it("should render without prefix by default", () => {
    const { container } = render(
      <Streamdown mode="static">**bold text**</Streamdown>
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).not.toMatch(/tw:/);
  });

  it("should prefix internal component classes", () => {
    const { container } = render(
      <Streamdown prefix="tw" mode="static">
        **bold text**
      </Streamdown>
    );

    const strong = container.querySelector("[data-streamdown='strong']");
    expect(strong?.className).toMatch(/^tw:/);
  });
});
