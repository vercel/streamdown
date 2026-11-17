import { createMathPlugin } from "@streamdown/math";
import { fireEvent, render } from "@testing-library/react";
import { marked } from "marked";
import { createElement } from "react";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";
import { Markdown } from "../lib/markdown";
import {
  escapeMarkdownTableCell,
  extractTableDataFromElement,
  getTableCsvSeparator,
  type TableData,
  tableDataToCSV,
  tableDataToMarkdown,
  tableDataToTSV,
} from "../lib/table/utils";

describe("Table Utils", () => {
  describe("extractTableDataFromElement", () => {
    let tableElement: HTMLTableElement;

    beforeEach(() => {
      tableElement = document.createElement("table");
    });

    it("should extract headers and rows from a table", () => {
      tableElement.innerHTML = `
        <thead>
          <tr>
            <th>Name</th>
            <th>Age</th>
            <th>City</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>John</td>
            <td>30</td>
            <td>New York</td>
          </tr>
          <tr>
            <td>Jane</td>
            <td>25</td>
            <td>London</td>
          </tr>
        </tbody>
      `;

      const result = extractTableDataFromElement(tableElement);

      expect(result.headers).toEqual(["Name", "Age", "City"]);
      expect(result.rows).toEqual([
        ["John", "30", "New York"],
        ["Jane", "25", "London"],
      ]);
    });

    it("should handle empty cells", () => {
      tableElement.innerHTML = `
        <thead>
          <tr>
            <th>Col1</th>
            <th>Col2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Value</td>
            <td></td>
          </tr>
        </tbody>
      `;

      const result = extractTableDataFromElement(tableElement);

      expect(result.headers).toEqual(["Col1", "Col2"]);
      expect(result.rows).toEqual([["Value", ""]]);
    });

    it("should trim whitespace from cells", () => {
      tableElement.innerHTML = `
        <thead>
          <tr>
            <th>  Header  </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>  Data  </td>
          </tr>
        </tbody>
      `;

      const result = extractTableDataFromElement(tableElement);

      expect(result.headers).toEqual(["Header"]);
      expect(result.rows).toEqual([["Data"]]);
    });

    it("should handle tables with no tbody", () => {
      tableElement.innerHTML = `
        <thead>
          <tr>
            <th>Header</th>
          </tr>
        </thead>
      `;

      const result = extractTableDataFromElement(tableElement);

      expect(result.headers).toEqual(["Header"]);
      expect(result.rows).toEqual([]);
    });

    it("should handle tables with no thead", () => {
      tableElement.innerHTML = `
        <tbody>
          <tr>
            <td>Data</td>
          </tr>
        </tbody>
      `;

      const result = extractTableDataFromElement(tableElement);

      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([["Data"]]);
    });

    it("should convert <br> elements to newlines in cells", () => {
      tableElement.innerHTML = `
        <thead>
          <tr>
            <th>Header</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Paragraph one.<br>Paragraph two.</td>
          </tr>
        </tbody>
      `;

      const result = extractTableDataFromElement(tableElement);

      expect(result.rows).toEqual([["Paragraph one.\nParagraph two."]]);
    });

    it("should convert multiple <br> elements to newlines", () => {
      tableElement.innerHTML = `
        <thead>
          <tr>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Line A<br>Line B<br>Line C</td>
          </tr>
        </tbody>
      `;

      const result = extractTableDataFromElement(tableElement);

      expect(result.rows).toEqual([["Line A\nLine B\nLine C"]]);
    });

    it("should convert <br> inside nested elements to newlines", () => {
      tableElement.innerHTML = `
        <thead>
          <tr>
            <th>Header<br>with break</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Bold</strong><br><em>Italic</em></td>
          </tr>
        </tbody>
      `;

      const result = extractTableDataFromElement(tableElement);

      expect(result.headers).toEqual(["Header\nwith break"]);
      expect(result.rows).toEqual([["Bold\nItalic"]]);
    });
  });

  describe("tableDataToCSV", () => {
    it("should convert simple table data to CSV", () => {
      const data: TableData = {
        headers: ["Name", "Age", "City"],
        rows: [
          ["John", "30", "New York"],
          ["Jane", "25", "London"],
        ],
      };

      const result = tableDataToCSV(data);

      expect(result).toBe("Name,Age,City\nJohn,30,New York\nJane,25,London");
    });

    it("should escape commas in values", () => {
      const data: TableData = {
        headers: ["Name", "Location"],
        rows: [["John", "New York, USA"]],
      };

      const result = tableDataToCSV(data);

      expect(result).toBe('Name,Location\nJohn,"New York, USA"');
    });

    it("should escape quotes and separator together", () => {
      const data: TableData = {
        headers: ["Message"],
        rows: [['Hello, "World"']],
      };

      const result = tableDataToCSV(data);

      expect(result).toBe('Message\n"Hello, ""World"""');
    });

    it("should support semicolon separators", () => {
      const data: TableData = {
        headers: ["Name", "Location"],
        rows: [["Aradhya", "New York; USA"]],
      };

      const result = tableDataToCSV(data, ";");

      expect(result).toBe('Name;Location\nAradhya;"New York; USA"');
    });

    it("should use semicolon separator in auto mode for comma-decimal locales", () => {
      const numberFormatSpy = vi.spyOn(Intl, "NumberFormat").mockImplementation(
        () =>
          ({
            format: () => "1,1",
          }) as Intl.NumberFormat
      );

      const data: TableData = {
        headers: ["Name", "City"],
        rows: [["John", "Paris; France"]],
      };

      const result = tableDataToCSV(data, "auto");

      expect(result).toBe('Name;City\nJohn;"Paris; France"');

      numberFormatSpy.mockRestore();
    });

    it("should escape carriage returns", () => {
      const data: TableData = {
        headers: ["Text"],
        rows: [["line1\rline2"]],
      };

      const result = tableDataToCSV(data);

      expect(result).toBe('Text\n"line1\rline2"');
    });

    it("should escape quotes in values", () => {
      const data: TableData = {
        headers: ["Quote"],
        rows: [['He said "Hello"']],
      };

      const result = tableDataToCSV(data);

      expect(result).toBe('Quote\n"He said ""Hello"""');
    });

    it("should escape newlines in values", () => {
      const data: TableData = {
        headers: ["Text"],
        rows: [["Line 1\nLine 2"]],
      };

      const result = tableDataToCSV(data);

      expect(result).toBe('Text\n"Line 1\nLine 2"');
    });

    it("should support tab separators", () => {
      const data: TableData = {
        headers: ["Name", "Note"],
        rows: [["Mike", "A\tB"]],
      };

      const result = tableDataToCSV(data, "\t");

      expect(result).toBe('Name\tNote\nMike\t"A\tB"');
    });

    it("should not use separators as its single column", () => {
      const data: TableData = {
        headers: ["Name"],
        rows: [["John"]],
      };

      const result = tableDataToCSV(data, ";");

      expect(result).toBe("Name\nJohn");
    });

    it("should handle empty headers", () => {
      const data: TableData = {
        headers: [],
        rows: [["Value1", "Value2"]],
      };

      const result = tableDataToCSV(data);

      expect(result).toBe("Value1,Value2");
    });

    it("should handle empty rows", () => {
      const data: TableData = {
        headers: ["Header1", "Header2"],
        rows: [],
      };

      const result = tableDataToCSV(data);

      expect(result).toBe("Header1,Header2");
    });

    it("should handle empty values", () => {
      const data: TableData = {
        headers: ["Name", "Age"],
        rows: [["", ""]],
      };

      const result = tableDataToCSV(data);

      expect(result).toBe("Name,Age\n,");
    });

    it("should handle empty tables", () => {
      const data: TableData = {
        headers: [],
        rows: [],
      };

      const result = tableDataToCSV(data);

      expect(result).toBe("");
    });
  });

  describe("getTableCsvSeparator", () => {
    it("returns comma when controls is a boolean", () => {
      expect(getTableCsvSeparator(true)).toBe(",");
      expect(getTableCsvSeparator(false)).toBe(",");
    });

    it("returns comma when table is missing or a boolean", () => {
      expect(getTableCsvSeparator({})).toBe(",");
      expect(getTableCsvSeparator({ table: true })).toBe(",");
      expect(getTableCsvSeparator({ table: false })).toBe(",");
    });

    it("returns comma when csvSeparator is not set", () => {
      expect(getTableCsvSeparator({ table: {} })).toBe(",");
    });

    it("returns the configured separator", () => {
      expect(getTableCsvSeparator({ table: { csvSeparator: ";" } })).toBe(";");
      expect(getTableCsvSeparator({ table: { csvSeparator: "\t" } })).toBe(
        "\t"
      );
      expect(getTableCsvSeparator({ table: { csvSeparator: "auto" } })).toBe(
        "auto"
      );
    });
  });

  describe("tableDataToTSV", () => {
    it("should convert simple table data to TSV", () => {
      const data: TableData = {
        headers: ["Name", "Age", "City"],
        rows: [
          ["John", "30", "New York"],
          ["Jane", "25", "London"],
        ],
      };

      const result = tableDataToTSV(data);

      expect(result).toBe(
        "Name\tAge\tCity\nJohn\t30\tNew York\nJane\t25\tLondon"
      );
    });

    it("should escape tabs in values", () => {
      const data: TableData = {
        headers: ["Text"],
        rows: [["Value\tWith\tTabs"]],
      };

      const result = tableDataToTSV(data);

      expect(result).toBe("Text\nValue\\tWith\\tTabs");
    });

    it("should escape newlines in values", () => {
      const data: TableData = {
        headers: ["Text"],
        rows: [["Line1\nLine2"]],
      };

      const result = tableDataToTSV(data);

      expect(result).toBe("Text\nLine1\\nLine2");
    });

    it("should escape carriage returns in values", () => {
      const data: TableData = {
        headers: ["Text"],
        rows: [["Value\rWith\rCR"]],
      };

      const result = tableDataToTSV(data);

      expect(result).toBe("Text\nValue\\rWith\\rCR");
    });

    it("should handle empty headers", () => {
      const data: TableData = {
        headers: [],
        rows: [["Value1", "Value2"]],
      };

      const result = tableDataToTSV(data);

      expect(result).toBe("Value1\tValue2");
    });

    it("should handle empty rows", () => {
      const data: TableData = {
        headers: ["Header1", "Header2"],
        rows: [],
      };

      const result = tableDataToTSV(data);

      expect(result).toBe("Header1\tHeader2");
    });
  });

  describe("escapeMarkdownTableCell", () => {
    it("should escape pipes", () => {
      const result = escapeMarkdownTableCell("Column | Value");
      expect(result).toBe("Column \\| Value");
    });

    it("should escape backslashes", () => {
      const result = escapeMarkdownTableCell("Path\\To\\File");
      expect(result).toBe("Path\\\\To\\\\File");
    });

    it("should escape backslashes before pipes", () => {
      const result = escapeMarkdownTableCell("A\\|B");
      expect(result).toBe("A\\\\\\|B");
    });

    it("should handle strings with no special characters", () => {
      const result = escapeMarkdownTableCell("Normal text");
      expect(result).toBe("Normal text");
    });

    it("should handle empty strings", () => {
      const result = escapeMarkdownTableCell("");
      expect(result).toBe("");
    });

    it("should convert newlines to <br>", () => {
      const result = escapeMarkdownTableCell("Paragraph one.\nParagraph two.");
      expect(result).toBe("Paragraph one.<br>Paragraph two.");
    });

    it("should escape HTML-sensitive characters as entities", () => {
      expect(escapeMarkdownTableCell("Array<string>")).toBe(
        "Array&lt;string&gt;"
      );
      expect(escapeMarkdownTableCell("&copy;")).toBe("&amp;copy;");
      expect(escapeMarkdownTableCell("a<br>b")).toBe("a&lt;br&gt;b");
      expect(escapeMarkdownTableCell("x < y & z > w")).toBe(
        "x &lt; y &amp; z &gt; w"
      );
    });
  });

  describe("tableDataToMarkdown", () => {
    it.each([
      ["https://example.com", "https://example.com"],
      ["https://example.com/a_b", "https://example.com/a_b"],
      ["https://example.com/a~b", "https://example.com/a~b"],
      ["www.example.com/a_b", "http://www.example.com/a_b"],
      ["user@example.com", "mailto:user@example.com"],
      ["user_name@example.com", "mailto:user_name@example.com"],
      [
        "https://example.com/a?x=one_two&y=three_four",
        "https://example.com/a?x=one_two&y=three_four",
      ],
      [
        "www.example.com/a_b?x=one_two&y=3",
        "http://www.example.com/a_b?x=one_two&y=3",
      ],
      [
        "first.last+tag_name@example-domain.com",
        "mailto:first.last+tag_name@example-domain.com",
      ],
    ])("should preserve the text and target of the bare link %s", (text, href) => {
      const data: TableData = { headers: [text], rows: [[text]] };
      const { container } = render(
        Markdown({
          children: tableDataToMarkdown(data),
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeRaw],
        })
      );
      const table = container.querySelector("table") as HTMLTableElement;

      expect(extractTableDataFromElement(table)).toEqual(data);
      expect(
        [...table.querySelectorAll("a")].map((link) =>
          link.getAttribute("href")
        )
      ).toEqual([href, href]);
    });

    it.each([
      "`https://example.com/a_b`",
      "**https://example.com/a_b**",
      "_https://example.com/a_b_",
      "~~https://example.com/a_b~~",
      "[label](https://example.com/a_b)",
      "![alt](https://example.com/a_b)",
      "https://example.com/a_b and **literal**",
      "**before** https://example.com/a_b _after_",
      "https://example.com/a_b, https://example.com/c_d",
      "(https://example.com/a_(b))",
      "www.example.com/a_b.",
      "https://example.com/a?x=one_two&y=three_four",
      "HTTPS://EXAMPLE.COM/a_b",
      "ftp://example.com/a_b",
      "prefixhttps://example.com/a_b",
      "mailto:user_name@example.com",
      "user+tag_name@example.com",
      "user*name@example.com",
      "<https://example.com/a_b>",
      "网址：https://example.com/中_文",
      "😀 https://example.com/a_b",
      "https://example.com/*a* _literal_",
      "https://example.com/[a_b]",
      "**https://example.com/a**",
      "https://example.com/a`b`",
      "[reference] https://example.com/a_b\n`code`",
      "https://example.com/a|b",
      "https://example.com/a_b $x + 1$",
      "$https://example.com/x$ and $y$",
      "www.example.com/path_*value*",
      "https://example.com/a\\b",
      "https://example.com/a&amp;b",
      "https://example.com/a&#95;b",
    ])("should preserve literal link boundaries: %s", (text) => {
      const data: TableData = { headers: [text], rows: [[text]] };
      const markdown = tableDataToMarkdown(data);
      const { container } = render(
        Markdown({
          children: markdown,
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeRaw],
        })
      );
      const table = container.querySelector("table") as HTMLTableElement;
      expect(extractTableDataFromElement(table)).toEqual(data);

      const markedContainer = document.createElement("div");
      markedContainer.innerHTML = marked.parse(markdown, { async: false });
      expect(
        extractTableDataFromElement(
          markedContainer.querySelector("table") as HTMLTableElement
        )
      ).toEqual(data);
    });

    it.each([
      false,
      true,
    ])("should preserve literal math with singleDollarTextMath=%s", (singleDollarTextMath) => {
      const math = createMathPlugin({ singleDollarTextMath });
      const data: TableData = {
        headers: ["$Math$"],
        rows: [
          ["$x + 1$"],
          ["$$x + 1$$"],
          ["$\\alpha_1$"],
          ["https://example.com/a_b $x_1$"],
        ],
      };
      const { container } = render(
        Markdown({
          children: tableDataToMarkdown(data),
          remarkPlugins: [remarkGfm, math.remarkPlugin],
          rehypePlugins: [rehypeRaw, math.rehypePlugin],
        })
      );
      const table = container.querySelector("table") as HTMLTableElement;

      expect(extractTableDataFromElement(table)).toEqual(data);
      expect(table.querySelector(".katex, math, code")).toBeNull();
    });

    it.each([
      "static",
      "streaming",
    ] as const)("should preserve exported text through Streamdown in %s mode", (mode) => {
      const math = createMathPlugin({ singleDollarTextMath: true });
      const data: TableData = {
        headers: ["**Cell**"],
        rows: [
          ["https://example.com/a?x=one_two&y=three_four"],
          ["**https://example.com/a_b**"],
          ["$\\alpha_1$"],
          ["First line\nSecond line"],
        ],
      };
      const { container } = render(
        createElement(
          Streamdown,
          { mode, plugins: { math } },
          tableDataToMarkdown(data)
        )
      );
      const table = container.querySelector("table") as HTMLTableElement;

      expect(extractTableDataFromElement(table)).toEqual(data);
      fireEvent.click(
        table.querySelector('[data-streamdown="link"]') as HTMLElement
      );
      expect(
        document.querySelector('[data-streamdown="link-safety-modal"]')
          ?.textContent
      ).toContain(data.rows[0][0]);
      expect(table.querySelector(".katex, math, strong, code")).toBeNull();
    });

    it("should preserve literal HTML and entities when rendered again", () => {
      const table = document.createElement("table");
      table.innerHTML = `
        <thead><tr><th>Type &lt;T&gt;</th><th>Entities</th></tr></thead>
        <tbody><tr>
          <td><code>Array&lt;string&gt;</code></td>
          <td>&amp;copy; and &amp;#124;</td>
        </tr></tbody>
      `;
      const data = extractTableDataFromElement(table);
      const markdown = tableDataToMarkdown(data);
      const container = document.createElement("div");
      container.innerHTML = marked.parse(markdown, { async: false });
      const restoredTable = container.querySelector(
        "table"
      ) as HTMLTableElement;

      expect(extractTableDataFromElement(restoredTable)).toEqual(data);
    });

    it("should preserve literal HTML and entities via Streamdown Markdown", () => {
      const table = document.createElement("table");
      table.innerHTML = `
        <thead><tr><th>Type &lt;T&gt;</th><th>Entities</th></tr></thead>
        <tbody><tr>
          <td><code>Array&lt;string&gt;</code></td>
          <td>&amp;copy; and &amp;#124;</td>
        </tr></tbody>
      `;
      const data = extractTableDataFromElement(table);
      const markdown = tableDataToMarkdown(data);

      // Same fixture through Streamdown's production pipeline (remark-gfm + rehype-raw)
      const { container } = render(
        Markdown({
          children: markdown,
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeRaw],
        })
      );
      const restoredTable = container.querySelector(
        "table"
      ) as HTMLTableElement;

      expect(extractTableDataFromElement(restoredTable)).toEqual(data);
    });

    it("should preserve literal Markdown syntax when rendered again", () => {
      const data: TableData = {
        headers: ["**Cell**"],
        rows: [
          ["**bold**"],
          ["_italic_"],
          ["~~deleted~~"],
          ["`code`"],
          ["[link](https://example.com)"],
          ["![image](https://example.com/image.png)"],
          ["[reference]"],
          ["a\\b | *value* & <tag>"],
        ],
      };
      const markdown = tableDataToMarkdown(data);

      const { container } = render(
        Markdown({
          children: markdown,
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeRaw],
        })
      );
      const restoredTable = container.querySelector(
        "table"
      ) as HTMLTableElement;

      expect(extractTableDataFromElement(restoredTable)).toEqual(data);
      expect(
        restoredTable.querySelector("strong, em, del, code, img")
      ).toBeNull();
    });

    it("should convert simple table data to Markdown", () => {
      const data: TableData = {
        headers: ["Name", "Age", "City"],
        rows: [
          ["John", "30", "New York"],
          ["Jane", "25", "London"],
        ],
      };

      const result = tableDataToMarkdown(data);

      expect(result).toBe(
        "| Name | Age | City |\n| --- | --- | --- |\n| John | 30 | New York |\n| Jane | 25 | London |"
      );
    });

    it("should escape pipes in values", () => {
      const data: TableData = {
        headers: ["Header"],
        rows: [["Value | With | Pipes"]],
      };

      const result = tableDataToMarkdown(data);

      expect(result).toBe("| Header |\n| --- |\n| Value \\| With \\| Pipes |");
    });

    it("should escape backslashes in values", () => {
      const data: TableData = {
        headers: ["Path"],
        rows: [["C:\\Users\\Name"]],
      };

      const result = tableDataToMarkdown(data);

      expect(result).toBe("| Path |\n| --- |\n| C:\\\\Users\\\\Name |");
    });

    it("should pad rows with empty strings if shorter than headers", () => {
      const data: TableData = {
        headers: ["Col1", "Col2", "Col3"],
        rows: [["A", "B"]],
      };

      const result = tableDataToMarkdown(data);

      expect(result).toBe(
        "| Col1 | Col2 | Col3 |\n| --- | --- | --- |\n| A | B |  |"
      );
    });

    it("should emit an empty header row when there are no headers", () => {
      const data: TableData = {
        headers: [],
        rows: [["Value1", "Value2"]],
      };

      expect(tableDataToMarkdown(data)).toBe(
        "|  |  |\n| --- | --- |\n| Value1 | Value2 |"
      );
    });

    it("should size the empty header row to the widest row", () => {
      const data: TableData = {
        headers: [],
        rows: [["a"], ["b", "c", "d"]],
      };

      expect(tableDataToMarkdown(data)).toBe(
        "|  |  |  |\n| --- | --- | --- |\n| a |  |  |\n| b | c | d |"
      );
    });

    it("should return empty string if there are no headers and no rows", () => {
      expect(tableDataToMarkdown({ headers: [], rows: [] })).toBe("");
    });

    it("should handle empty rows", () => {
      const data: TableData = {
        headers: ["Header1", "Header2"],
        rows: [],
      };

      const result = tableDataToMarkdown(data);

      expect(result).toBe("| Header1 | Header2 |\n| --- | --- |");
    });

    it("should handle rows with more cells than headers", () => {
      const data: TableData = {
        headers: ["Col1", "Col2"],
        rows: [["A", "B", "C", "D"]],
      };

      const result = tableDataToMarkdown(data);

      // The function only includes cells up to the number of headers
      // Extra cells are ignored during the mapping
      expect(result).toBe("| Col1 | Col2 |\n| --- | --- |\n| A | B | C | D |");
    });

    it("should convert cell newlines to <br> for single-line table rows", () => {
      const data: TableData = {
        headers: ["Description"],
        rows: [["Paragraph one.\nParagraph two."]],
      };

      const result = tableDataToMarkdown(data);

      expect(result).toBe(
        "| Description |\n| --- |\n| Paragraph one.<br>Paragraph two. |"
      );
    });
  });

  describe("table images", () => {
    const buildTable = (cellHtml: string, headerHtml = "Logo") => {
      const table = document.createElement("table");
      table.innerHTML = `<thead><tr><th>${headerHtml}</th><th>Name</th></tr></thead><tbody><tr><td>${cellHtml}</td><td>Acme</td></tr></tbody>`;
      return table;
    };
    const toMarkdown = (table: HTMLElement) =>
      tableDataToMarkdown(extractTableDataFromElement(table));
    const fallback =
      '<span data-streamdown="image-fallback">Image not available</span>';

    it("should copy a valid image as Markdown", () => {
      const table = buildTable(
        '<img alt="Acme logo" src="https://example.com/logo.png">'
      );

      expect(toMarkdown(table)).toBe(
        "| Logo | Name |\n| --- | --- |\n| ![Acme logo](https://example.com/logo.png) | Acme |"
      );
    });

    it("should copy a broken image as Markdown without the fallback text", () => {
      const table = buildTable(
        `<div><img alt="Acme logo" src="https://example.com/broken.png" class="hidden">${fallback}</div>`
      );

      const markdown = toMarkdown(table);

      expect(markdown).toBe(
        "| Logo | Name |\n| --- | --- |\n| ![Acme logo](https://example.com/broken.png) | Acme |"
      );
      expect(markdown).not.toContain("Image not available");
    });

    it("should not include the fallback text in the extracted data", () => {
      const table = buildTable(
        `<img alt="a" src="https://example.com/a.png">${fallback}`
      );

      expect(extractTableDataFromElement(table).rows[0][0]).toBe(
        "![a](https://example.com/a.png)"
      );
    });

    it("should keep the image when the src is malformed", () => {
      const table = buildTable('<img alt="Bad" src="htp:/not a url">');

      expect(toMarkdown(table)).toContain("| ![Bad](htp:/not%20a%20url) |");
    });

    it("should keep relative and data sources as images", () => {
      const table = buildTable(
        '<img alt="rel" src="/images/a_b.png"><img alt="data" src="data:image/png;base64,AAAA">'
      );

      expect(toMarkdown(table)).toContain(
        "| ![rel](/images/a_b.png)![data](data:image/png;base64,AAAA) |"
      );
    });

    it("should keep an image with empty alt text", () => {
      const table = buildTable('<img src="https://example.com/a.png">');

      expect(toMarkdown(table)).toContain("| ![](https://example.com/a.png) |");
    });

    it("should skip an image without a src", () => {
      const table = buildTable('<img alt="nothing">');

      expect(toMarkdown(table)).toContain("|  | Acme |");
    });

    it("should escape special characters in alt and src", () => {
      const table = buildTable(
        '<img alt="a [b] | c" src="https://example.com/a (1).png">'
      );

      expect(toMarkdown(table)).toContain(
        "| ![a \\[b\\] \\| c](https://example.com/a%20%281%29.png) |"
      );
    });

    it("should keep images next to escaped text in the same cell", () => {
      const table = buildTable(
        '*note* <img alt="x" src="https://example.com/x.png"> a|b'
      );

      expect(toMarkdown(table)).toContain(
        "| \\*note\\* ![x](https://example.com/x.png) a\\|b |"
      );
    });

    it("should copy images in header cells", () => {
      const table = buildTable(
        "text",
        '<img alt="H" src="https://example.com/h.png">'
      );

      expect(toMarkdown(table)).toContain("| ![H](https://example.com/h.png) | Name |");
    });

    it("should keep literal image-like text escaped", () => {
      const table = buildTable("![lit](https://example.com/lit.png)");

      expect(toMarkdown(table)).toContain(
        "| !\\[lit\\](https\\://example.com/lit.png) |"
      );
    });

    it("should copy only the real image when literal image text is also present", () => {
      const table = buildTable(
        '![lit](https://example.com/lit.png)<img alt="real" src="https://example.com/real.png">'
      );

      const markdown = toMarkdown(table);

      expect(markdown).toContain("![real](https://example.com/real.png)");
      expect(markdown).toContain("!\\[lit\\]");
    });

    it("should escape image-like text when the data was not extracted from the DOM", () => {
      expect(
        tableDataToMarkdown({
          headers: ["A"],
          rows: [["![x](https://example.com/x.png)"]],
        })
      ).toContain("!\\[x\\]");
    });

    it("should copy broken images rendered by Streamdown's image component", () => {
      const { container } = render(
        createElement(Streamdown, {
          children:
            "| Logo | Name |\n| --- | --- |\n| ![Acme logo](https://example.com/hfbhb.png) | not working |",
        })
      );
      const img = container.querySelector("table img") as HTMLImageElement;
      fireEvent.error(img);

      const table = container.querySelector("table") as HTMLTableElement;
      expect(table.textContent).toContain("Image not available");
      expect(toMarkdown(table)).toBe(
        "| Logo | Name |\n| --- | --- |\n| ![Acme logo](https://example.com/hfbhb.png) | not working |"
      );
    });
  });

  describe("tables with row headers and no header row", () => {
    const htmlTable =
      "<table><tbody><tr><th>Revenue</th><td>100</td></tr><tr><th>Costs</th><td>40</td></tr></tbody></table>";
    const buildTable = (html: string) => {
      const container = document.createElement("div");
      container.innerHTML = html;
      return container.querySelector("table") as HTMLTableElement;
    };

    it("should keep <th> cells in body rows", () => {
      expect(extractTableDataFromElement(buildTable(htmlTable))).toEqual({
        headers: [],
        rows: [
          ["Revenue", "100"],
          ["Costs", "40"],
        ],
      });
    });

    it("should copy a table without a header row as valid Markdown", () => {
      const table = buildTable(htmlTable);

      expect(tableDataToMarkdown(extractTableDataFromElement(table))).toBe(
        "|  |  |\n| --- | --- |\n| Revenue | 100 |\n| Costs | 40 |"
      );
    });

    it("should keep every cell in CSV and TSV", () => {
      const data = extractTableDataFromElement(buildTable(htmlTable));

      expect(tableDataToCSV(data)).toBe("Revenue,100\nCosts,40");
      expect(tableDataToTSV(data)).toBe("Revenue\t100\nCosts\t40");
    });

    it("should keep row headers when the table also has a thead", () => {
      const table = buildTable(
        "<table><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody><tr><th>Revenue</th><td>100</td></tr></tbody></table>"
      );

      expect(tableDataToMarkdown(extractTableDataFromElement(table))).toBe(
        "| Item | Amount |\n| --- | --- |\n| Revenue | 100 |"
      );
    });

    it("should keep images in row headers", () => {
      const table = buildTable(
        '<table><tbody><tr><th><img alt="Acme" src="https://example.com/a.png"></th><td>1</td></tr></tbody></table>'
      );

      expect(tableDataToMarkdown(extractTableDataFromElement(table))).toBe(
        "|  |  |\n| --- | --- |\n| ![Acme](https://example.com/a.png) | 1 |"
      );
    });

    it("should produce a table that renders back with the same cells", () => {
      const markdown = tableDataToMarkdown(
        extractTableDataFromElement(buildTable(htmlTable))
      );
      const { container } = render(
        Markdown({ children: markdown, remarkPlugins: [remarkGfm] })
      );
      const restored = container.querySelector("table") as HTMLTableElement;

      expect(
        [...restored.querySelectorAll("tbody tr")].map((row) =>
          [...row.querySelectorAll("td")].map((cell) => cell.textContent)
        )
      ).toEqual([
        ["Revenue", "100"],
        ["Costs", "40"],
      ]);
    });
  });
});
