import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { parseMarkdownIntoBlocks } from "../lib/parse-blocks";

describe("Nested details elements", () => {
  describe("parseMarkdownIntoBlocks", () => {
    it("should keep nested same-tag HTML blocks as a single balanced block", () => {
      const markdown = `Text before

<details>
<summary>Outer</summary>

<details>
<summary>Inner</summary>

Inner content

</details>

Outer content after inner closes

</details>

Text after`;

      const blocks = parseMarkdownIntoBlocks(markdown);
      const detailsBlock = blocks.find((b) => b.includes("<details>"));

      const openCount = (detailsBlock?.match(/<details>/g) ?? []).length;
      const closeCount = (detailsBlock?.match(/<\/details>/g) ?? []).length;
      expect(openCount).toBe(2);
      expect(closeCount).toBe(2);
      expect(detailsBlock).toContain("Outer content after inner closes");
      expect(detailsBlock).not.toContain("Text after");
    });

    it("should handle triple-nested same-tag HTML blocks", () => {
      const markdown = `<details>
<summary>L1</summary>

<details>
<summary>L2</summary>

<details>
<summary>L3</summary>

Deep content

</details>

</details>

</details>`;

      const blocks = parseMarkdownIntoBlocks(markdown);
      const detailsBlock = blocks.find((b) => b.includes("<details>"));

      const openCount = (detailsBlock?.match(/<details>/g) ?? []).length;
      const closeCount = (detailsBlock?.match(/<\/details>/g) ?? []).length;
      expect(openCount).toBe(3);
      expect(closeCount).toBe(3);
    });
  });

  describe("rendered DOM structure", () => {
    it("should nest inner details inside outer details", () => {
      const markdown = `<details>
<summary>Outer</summary>

<details>
<summary>Inner</summary>

Inner content

</details>

Outer content

</details>`;

      const { container } = render(<Streamdown>{markdown}</Streamdown>);

      const outer = container.querySelector("details");
      expect(outer).toBeTruthy();
      expect(outer?.querySelector(":scope > summary")?.textContent).toBe(
        "Outer"
      );

      const inner = outer?.querySelector("details");
      expect(inner).toBeTruthy();
      expect(inner?.querySelector(":scope > summary")?.textContent).toBe(
        "Inner"
      );

      expect(outer?.textContent).toContain("Outer content");
      expect(outer?.textContent).toContain("Inner content");
    });

    it("should keep sibling content inside outer details after inner closes", () => {
      const markdown = `<details>
<summary>Outer</summary>

<details>
<summary>Inner</summary>

Inner content

</details>

### Heading after inner

| A | B |
|---|---|
| 1 | 2 |

</details>`;

      const { container } = render(<Streamdown>{markdown}</Streamdown>);

      const outer = container.querySelector("details");
      expect(outer).toBeTruthy();

      // Heading and table should be inside the outer details, not leaked out
      const heading = outer?.querySelector("h3");
      expect(heading?.textContent).toContain("Heading after inner");

      const table = outer?.querySelector("table");
      expect(table).toBeTruthy();
    });

    it("should produce only one top-level details for a fully nested structure", () => {
      const markdown = `Before

<details>
<summary>Top</summary>

<details>
<summary>Nested</summary>

Nested content

</details>

</details>

After`;

      const { container } = render(<Streamdown>{markdown}</Streamdown>);

      const allDetails = container.querySelectorAll("details");
      const topLevel = [...allDetails].filter(
        (d) => !d.parentElement?.closest("details")
      );
      expect(topLevel.length).toBe(1);
      expect(topLevel[0].querySelector(":scope > summary")?.textContent).toBe(
        "Top"
      );
    });
  });
});
