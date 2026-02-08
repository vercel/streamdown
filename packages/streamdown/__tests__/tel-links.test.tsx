import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { defaultRehypePlugins } from "../index";
import { Markdown } from "../lib/markdown";

const rehypePlugins = Object.values(defaultRehypePlugins);

describe("Tel Links (#373)", () => {
  it("should render tel: links", () => {
    const { container } = render(
      <Markdown
        rehypePlugins={rehypePlugins}
        children="[call me](tel:01392498505)"
      />
    );
    const link = container.querySelector("a");
    expect(link).toBeTruthy();
    expect(link?.getAttribute("href")).toBe("tel:01392498505");
    expect(link?.textContent).toBe("call me");
  });

  it("should render tel: links alongside mailto: and http: links", () => {
    const content =
      "[phone](tel:01392498505) [email](mailto:foo@example.com) [website](http://example.com)";
    const { container } = render(
      <Markdown rehypePlugins={rehypePlugins} children={content} />
    );
    const links = container.querySelectorAll("a");
    expect(links.length).toBe(3);
    expect(links[0]?.getAttribute("href")).toBe("tel:01392498505");
    expect(links[1]?.getAttribute("href")).toBe("mailto:foo@example.com");
    expect(links[2]?.getAttribute("href")).toBe("http://example.com/");
  });

  it("should render tel: links with international format", () => {
    const { container } = render(
      <Markdown
        rehypePlugins={rehypePlugins}
        children="[call](tel:+44-1392-498505)"
      />
    );
    const link = container.querySelector("a");
    expect(link).toBeTruthy();
    expect(link?.getAttribute("href")).toBe("tel:+44-1392-498505");
  });
});
