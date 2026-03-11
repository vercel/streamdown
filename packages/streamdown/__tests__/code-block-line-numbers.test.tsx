import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { CodeBlock } from "../lib/code-block";
import { CodeBlockBody } from "../lib/code-block/body";

describe("line numbers", () => {
  const baseResult = {
    tokens: [[{ content: "const x = 1;", color: "#000" }]],
    bg: "#fff",
    fg: "#000",
  };

  describe("CodeBlockBody", () => {
    it("shows line numbers by default", () => {
      const { container } = render(
        <CodeBlockBody language="js" result={baseResult} />
      );
      const span = container.querySelector("code span");
      // The line number classes include before:content-[counter(line)]
      expect(span?.className).toContain("before:content-[counter(line)]");
    });

    it("hides line numbers when lineNumbers={false}", () => {
      const { container } = render(
        <CodeBlockBody language="js" lineNumbers={false} result={baseResult} />
      );
      const span = container.querySelector("code span");
      expect(span?.className ?? "").not.toContain(
        "before:content-[counter(line)]"
      );
    });

    it("applies counter CSS classes to <code> when lineNumbers={true}", () => {
      const { container } = render(
        <CodeBlockBody language="js" lineNumbers={true} result={baseResult} />
      );
      const code = container.querySelector("code");
      expect(code?.className).toContain("[counter-reset:line]");
    });

    it("does not apply counter CSS classes to <code> when lineNumbers={false}", () => {
      const { container } = render(
        <CodeBlockBody language="js" lineNumbers={false} result={baseResult} />
      );
      const code = container.querySelector("code");
      expect(code?.className ?? "").not.toContain("[counter-reset:line]");
    });

    it("does not apply counterReset style when lineNumbers={false} and startLine is set", () => {
      const { container } = render(
        <CodeBlockBody
          language="js"
          lineNumbers={false}
          result={baseResult}
          startLine={5}
        />
      );
      const code = container.querySelector("code");
      expect(code?.getAttribute("style") ?? "").not.toContain("counter-reset");
    });

    it("applies counterReset style when lineNumbers={true} and startLine > 1", () => {
      const { container } = render(
        <CodeBlockBody
          language="js"
          lineNumbers={true}
          result={baseResult}
          startLine={5}
        />
      );
      const code = container.querySelector("code");
      expect(code?.getAttribute("style")).toContain("counter-reset");
    });
  });

  describe("CodeBlock component", () => {
    it("renders with line numbers by default", () => {
      const { container } = render(
        <CodeBlock code="const x = 1;" language="js" />
      );
      const body = container.querySelector(
        '[data-streamdown="code-block-body"]'
      );
      expect(body).toBeTruthy();
    });

    it("renders without line numbers when lineNumbers={false}", () => {
      const { container } = render(
        <CodeBlock code="const x = 1;" language="js" lineNumbers={false} />
      );
      const code = container.querySelector("code");
      expect(code?.className ?? "").not.toContain("[counter-reset:line]");
    });
  });

  describe("Streamdown component", () => {
    const markdown = "```js\nconst x = 1;\n```";

    it("shows line numbers by default", () => {
      const { container } = render(<Streamdown>{markdown}</Streamdown>);
      const code = container.querySelector("code");
      expect(code?.className).toContain("[counter-reset:line]");
    });

    it("hides line numbers when lineNumbers={false}", () => {
      const { container } = render(
        <Streamdown lineNumbers={false}>{markdown}</Streamdown>
      );
      const code = container.querySelector("code");
      expect(code?.className ?? "").not.toContain("[counter-reset:line]");
    });

    it("shows line numbers when lineNumbers={true} (explicit)", () => {
      const { container } = render(
        <Streamdown lineNumbers={true}>{markdown}</Streamdown>
      );
      const code = container.querySelector("code");
      expect(code?.className).toContain("[counter-reset:line]");
    });

    it("hides line numbers for noLineNumbers meta-string", () => {
      const { container } = render(
        <Streamdown>{"```js noLineNumbers\nconst x = 1;\n```"}</Streamdown>
      );
      const code = container.querySelector("code");
      expect(code?.className ?? "").not.toContain("[counter-reset:line]");
    });

    it("noLineNumbers meta overrides lineNumbers={true} context", () => {
      const { container } = render(
        <Streamdown lineNumbers={true}>
          {"```js noLineNumbers\nconst x = 1;\n```"}
        </Streamdown>
      );
      const code = container.querySelector("code");
      expect(code?.className ?? "").not.toContain("[counter-reset:line]");
    });
  });
});
