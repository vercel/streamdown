import { render } from "@testing-library/react";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";
import { defaultRehypePlugins, Streamdown } from "../index";
import { Markdown } from "../lib/markdown";
import { remarkDisableAutolinkProtocols } from "../lib/remark/disable-autolink-protocols";

const rehypePlugins = Object.values(defaultRehypePlugins);

describe("Disable Autolink Protocols (#607)", () => {
  describe("remarkPlugins wiring (remarkDisableAutolinkProtocols)", () => {
    it("does not link a bare email when mailto is disabled", () => {
      const content = "Contact me at foo@example.com for details";
      const { container } = render(
        <Markdown
          children={content}
          rehypePlugins={rehypePlugins}
          remarkPlugins={[
            remarkGfm,
            [remarkDisableAutolinkProtocols, ["mailto"]],
          ]}
        />
      );

      expect(container.querySelector("a")).toBeNull();
      expect(container.textContent).toBe(content);
    });

    it("keeps default autolink behavior when the plugin is not added", () => {
      const content = "Contact me at foo@example.com for details";
      const { container } = render(
        <Markdown
          children={content}
          rehypePlugins={rehypePlugins}
          remarkPlugins={[remarkGfm]}
        />
      );

      const link = container.querySelector("a");
      expect(link).toBeTruthy();
      expect(link?.getAttribute("href")).toBe("mailto:foo@example.com");
      expect(link?.textContent).toBe("foo@example.com");
      expect(container.textContent).toBe(content);
    });

    it("keeps explicit markdown mailto links even when mailto is disabled", () => {
      const content = "[Email us](mailto:foo@example.com) any time";
      const { container } = render(
        <Markdown
          children={content}
          rehypePlugins={rehypePlugins}
          remarkPlugins={[
            remarkGfm,
            [remarkDisableAutolinkProtocols, ["mailto"]],
          ]}
        />
      );

      const link = container.querySelector("a");
      expect(link).toBeTruthy();
      expect(link?.getAttribute("href")).toBe("mailto:foo@example.com");
      expect(link?.textContent).toBe("Email us");
    });

    it("still links http/https autolinks when only mailto is disabled", () => {
      const content = "Visit https://example.com for more";
      const { container } = render(
        <Markdown
          children={content}
          rehypePlugins={rehypePlugins}
          remarkPlugins={[
            remarkGfm,
            [remarkDisableAutolinkProtocols, ["mailto"]],
          ]}
        />
      );

      const link = container.querySelector("a");
      expect(link).toBeTruthy();
      expect(link?.getAttribute("href")).toBe("https://example.com/");
    });

    it("is case-insensitive and accepts a trailing colon", () => {
      for (const protocol of ["mailto", "MAILTO", "mailto:", "MailTo:"]) {
        const content = "foo@example.com";
        const { container } = render(
          <Markdown
            children={content}
            rehypePlugins={rehypePlugins}
            remarkPlugins={[
              remarkGfm,
              [remarkDisableAutolinkProtocols, [protocol]],
            ]}
          />
        );

        expect(container.querySelector("a")).toBeNull();
      }
    });

    it("disables http(s) autolinks when https is disabled, leaving mailto untouched", () => {
      const content = "See https://example.com or email foo@example.com";
      const { container } = render(
        <Markdown
          children={content}
          rehypePlugins={rehypePlugins}
          remarkPlugins={[
            remarkGfm,
            [remarkDisableAutolinkProtocols, ["https"]],
          ]}
        />
      );

      const links = container.querySelectorAll("a");
      expect(links.length).toBe(1);
      expect(links[0]?.getAttribute("href")).toBe("mailto:foo@example.com");
      expect(container.textContent).toBe(content);
    });
  });

  describe("Streamdown disableAutolinkProtocols prop", () => {
    it("unwraps disabled bare-email autolinks to plain text", () => {
      const content = "Contact foo@example.com now";
      const { container } = render(
        <Streamdown
          disableAutolinkProtocols={["mailto"]}
          linkSafety={{ enabled: false }}
        >
          {content}
        </Streamdown>
      );

      expect(container.querySelector('[data-streamdown="link"]')).toBeNull();
      expect(container.textContent).toBe(content);
    });

    it("leaves autolinks unchanged when the prop is not provided", () => {
      const content = "Contact foo@example.com now";
      const { container } = render(
        <Streamdown linkSafety={{ enabled: false }}>{content}</Streamdown>
      );

      const link = container.querySelector('[data-streamdown="link"]');
      expect(link).toBeTruthy();
      expect(link?.getAttribute("href")).toBe("mailto:foo@example.com");
    });
  });
});
