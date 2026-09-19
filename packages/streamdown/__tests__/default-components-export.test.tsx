import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { defaultComponents, Streamdown } from "../index";

describe("defaultComponents export", () => {
  it("exports the built-in component map from the package root", () => {
    expect(defaultComponents).toBeTruthy();
    // memo() components are objects with $$typeof, not plain functions
    expect(defaultComponents.h2).toBeTruthy();
    expect(defaultComponents.a).toBeTruthy();
    expect(defaultComponents.code).toBeTruthy();
    expect(defaultComponents.pre).toBeTruthy();
  });

  it("preserves default styles when composing through an override", () => {
    const DefaultH2 = defaultComponents.h2;

    const { container } = render(
      <Streamdown
        components={{
          h2: (props) => (
            <DefaultH2
              {...props}
              className={`${props.className ?? ""} text-blue-500`}
            />
          ),
        }}
      >
        {"## Hello"}
      </Streamdown>
    );

    const heading = container.querySelector("h2");
    expect(heading).toBeTruthy();
    expect(heading?.getAttribute("data-streamdown")).toBe("heading-2");
    expect(heading?.className).toContain("mt-6");
    expect(heading?.className).toContain("mb-2");
    expect(heading?.className).toContain("font-semibold");
    expect(heading?.className).toContain("text-2xl");
    expect(heading?.className).toContain("text-blue-500");
    expect(heading?.textContent).toBe("Hello");
  });

  it("supports createElement composition for conditional overrides", () => {
    const { container } = render(
      <Streamdown
        components={{
          a: (props) => {
            if (props.href === "https://example.com/override") {
              return <a {...props}>overridden</a>;
            }

            return createElement(defaultComponents.a, props);
          },
        }}
        linkSafety={{ enabled: false }}
      >
        {
          "[default link](https://example.com) and [custom](https://example.com/override)"
        }
      </Streamdown>
    );

    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(2);
    expect(links[0]?.getAttribute("data-streamdown")).toBe("link");
    expect(links[0]?.textContent).toBe("default link");
    expect(links[1]?.textContent).toBe("overridden");
    expect(links[1]?.getAttribute("data-streamdown")).toBeNull();
  });
});
