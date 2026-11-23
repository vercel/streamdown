import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

  for (const mode of ["static", "streaming"] as const) {
    it(`leaves hash-route and same-page links without a clobbered target alone in ${mode} mode`, () => {
      const { container } = render(
        <Streamdown linkSafety={{ enabled: false }} mode={mode}>
          {"[a](#/tools/x) and [b](#section)"}
        </Streamdown>
      );

      expect(
        Array.from(container.querySelectorAll("a"), (link) =>
          link.getAttribute("href")
        )
      ).toEqual(["#/tools/x", "#section"]);
    });
  }

  it("only rewrites links whose raw HTML target exists", () => {
    const { container } = render(
      <Streamdown linkSafety={{ enabled: false }} mode="streaming">
        {
          '<div id="details">Details</div>\n\n[Go](#details) [Route](#/tools/x) [Other](#section)'
        }
      </Streamdown>
    );

    expect(
      Array.from(container.querySelectorAll("a"), (link) =>
        link.getAttribute("href")
      )
    ).toEqual(["#user-content-details", "#/tools/x", "#section"]);
  });

  it("rewrites links to non-ASCII raw HTML ids across streaming blocks", () => {
    const { container } = render(
      <Streamdown linkSafety={{ enabled: false }} mode="streaming">
        {'<div id="café">Details</div>\n\n[Go](#café) [Other](#cafe)'}
      </Streamdown>
    );

    expect(
      Array.from(container.querySelectorAll("a"), (link) =>
        link.getAttribute("href")
      )
    ).toEqual(["#user-content-caf%C3%A9", "#cafe"]);
  });

  it("decodes character references in raw HTML ids across streaming blocks", () => {
    const { container } = render(
      <Streamdown linkSafety={{ enabled: false }} mode="streaming">
        {
          '<div id="a&amp;b">One</div>\n\n<div id="caf&#233;">Two</div>\n\n[One](#a&b) [Two](#café)'
        }
      </Streamdown>
    );

    expect(
      Array.from(container.querySelectorAll("a"), (link) =>
        link.getAttribute("href")
      )
    ).toEqual(["#user-content-a&b", "#user-content-caf%C3%A9"]);
  });

  for (const count of [32, 64]) {
    it(`bounds document-wide ID work linearly for ${count} streaming blocks`, () => {
      const markdown = Array.from(
        { length: count },
        (_, index) => `<div id="linear-id-${index}">Target</div>`
      ).join("\n\n");
      // Count operations, not elapsed time: each ID should be collected once,
      // not copied or serialized again for every independently rendered block.
      const addSpy = vi.spyOn(Set.prototype, "add");
      const stringifySpy = vi.spyOn(JSON, "stringify");
      let idInsertions = 0;
      let serializedIds = 0;
      try {
        const { container } = render(<Streamdown>{markdown}</Streamdown>);
        expect(container.querySelectorAll("div[id]")).toHaveLength(count);
        idInsertions = addSpy.mock.calls.filter(
          ([value]) =>
            typeof value === "string" && value.startsWith("linear-id-")
        ).length;
        serializedIds = stringifySpy.mock.results.reduce(
          (total, result) =>
            total +
            (result.type === "return" && typeof result.value === "string"
              ? [...result.value.matchAll(/linear-id-/g)].length
              : 0),
          0
        );
      } finally {
        addSpy.mockRestore();
        stringifySpy.mockRestore();
      }
      expect.soft(idInsertions).toBeLessThanOrEqual(count * 4);
      expect.soft(serializedIds).toBeLessThanOrEqual(count * 4);
    });
  }

  it("does not reuse document IDs after streaming content changes", () => {
    const { container, rerender } = render(
      <Streamdown linkSafety={{ enabled: false }}>
        {'[Go](#details)\n\n<div id="details">Details</div>'}
      </Streamdown>
    );
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "#user-content-details"
    );

    rerender(
      <Streamdown linkSafety={{ enabled: false }}>
        {'[Go](#details)\n\n<div id="other">Other</div>'}
      </Streamdown>
    );
    expect(container.querySelector("a")?.getAttribute("href")).toBe("#details");
  });

  it("does not share document IDs between simultaneous renderers", () => {
    const { container } = render(
      <>
        <Streamdown linkSafety={{ enabled: false }}>
          {'[First](#details)\n\n<div id="details">Details</div>'}
        </Streamdown>
        <Streamdown linkSafety={{ enabled: false }}>
          {'[Second](#details)\n\n<div id="other">Other</div>'}
        </Streamdown>
      </>
    );
    expect(
      Array.from(container.querySelectorAll("a"), (link) =>
        link.getAttribute("href")
      )
    ).toEqual(["#user-content-details", "#details"]);
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
