import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

describe("Sanitized fragment links", () => {
  it("rewrites raw HTML fragments but leaves prefixed and external links alone", () => {
    const { container } = render(
      <Streamdown linkSafety={{ enabled: false }} mode="static">
        {
          '<div id="details">Details</div>\n\n<a href="#details">Raw</a>\n\n[Prefixed](#user-content-details)\n\n[External](https://example.com/#details)'
        }
      </Streamdown>
    );

    expect(container.querySelector("[id]")?.id).toBe("user-content-details");
    expect(
      Array.from(container.querySelectorAll("a[href]"), (link) =>
        link.getAttribute("href")
      )
    ).toEqual([
      "#user-content-details",
      "#user-content-details",
      "https://example.com/#details",
    ]);
  });

  it("keeps footnote references and backrefs aligned", () => {
    const { container } = render(
      <Streamdown linkSafety={{ enabled: false }} mode="static">
        {"Note[^1].\n\n[^1]: Details."}
      </Streamdown>
    );

    const links = container.querySelectorAll('a[href^="#"]');
    expect(links.length).toBe(2);
    for (const link of links) {
      expect(
        container.querySelector(link.getAttribute("href") ?? "")
      ).toBeTruthy();
      expect(link.getAttribute("href")).not.toContain(
        "user-content-user-content-"
      );
    }
  });

  for (const mode of ["static", "streaming"] as const) {
    for (const allowedTags of [undefined, { snippet: ["id"] }]) {
      it(`keeps raw HTML targets reachable in ${mode} mode (${allowedTags ? "extended" : "default"} schema)`, () => {
        const { container } = render(
          <Streamdown
            allowedTags={allowedTags}
            linkSafety={{ enabled: false }}
            mode={mode}
          >
            {'<div id="details">Details</div>\n\n[Go](#details)'}
          </Streamdown>
        );

        const target = container.querySelector("[id]");
        const link = container.querySelector("a");

        expect(target?.id).toBe("user-content-details");
        expect(link?.getAttribute("href")).toBe(`#${target?.id}`);
      });
    }
  }
});
