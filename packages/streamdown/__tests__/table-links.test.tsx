import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import {
  extractTableDataFromElement,
  tableDataToCSV,
  tableDataToMarkdown,
  tableDataToTSV,
} from "../lib/table/utils";

const buildTable = (cellHtml: string) => {
  const table = document.createElement("table");
  table.innerHTML = `<thead><tr><th>Item</th><th>Link</th></tr></thead><tbody><tr><td>Release</td><td>${cellHtml}</td></tr></tbody>`;
  return table;
};

const toMarkdown = (table: HTMLElement) =>
  tableDataToMarkdown(extractTableDataFromElement(table));

describe("table links", () => {
  it("should keep a link's address in every export", () => {
    const table = buildTable(
      '<a href="https://example.com/releases/v1.2.0">Release notes</a>'
    );
    const data = extractTableDataFromElement(table);

    expect(tableDataToMarkdown(data)).toBe(
      "| Item | Link |\n| --- | --- |\n| Release | [Release notes](https://example.com/releases/v1.2.0) |"
    );
    expect(tableDataToCSV(data)).toBe(
      "Item,Link\nRelease,[Release notes](https://example.com/releases/v1.2.0)"
    );
    expect(tableDataToTSV(data)).toBe(
      "Item\tLink\nRelease\t[Release notes](https://example.com/releases/v1.2.0)"
    );
  });

  it("should keep the address of a link rendered behind link safety", () => {
    const { container } = render(
      <Streamdown>
        {
          "| Item | Link |\n|---|---|\n| Release | [Release notes](https://example.com/releases/v1.2.0) |"
        }
      </Streamdown>
    );
    const table = container.querySelector("table") as HTMLTableElement;

    expect(table.querySelector("button[data-streamdown='link']")).not.toBe(
      null
    );
    expect(toMarkdown(table)).toBe(
      "| Item | Link |\n| --- | --- |\n| Release | [Release notes](https://example.com/releases/v1.2.0) |"
    );
  });

  it("should keep the address of a rendered anchor", () => {
    const { container } = render(
      <Streamdown linkSafety={{ enabled: false }}>
        {
          "| Item | Link |\n|---|---|\n| Release | [Release notes](https://example.com/releases/v1.2.0) |"
        }
      </Streamdown>
    );
    const table = container.querySelector("table") as HTMLTableElement;

    expect(toMarkdown(table)).toBe(
      "| Item | Link |\n| --- | --- |\n| Release | [Release notes](https://example.com/releases/v1.2.0) |"
    );
  });

  it("should escape the link text and encode the address", () => {
    const table = buildTable(
      '<a href="https://example.com/a (1)|b">a | [b] *c*</a>'
    );

    expect(toMarkdown(table)).toContain(
      "| Release | [a \\| \\[b\\] \\*c\\*](https://example.com/a%20%281%29%7Cb) |"
    );
  });

  it("should keep an image inside a link", () => {
    const table = buildTable(
      '<a href="https://example.com/"><img alt="logo" src="https://example.com/logo.png"></a>'
    );

    expect(toMarkdown(table)).toContain(
      "| Release | [![logo](https://example.com/logo.png)](https://example.com/) |"
    );
  });

  it("should keep text next to a link escaped", () => {
    const table = buildTable(
      'see *this* <a href="https://example.com/x">x</a> a|b'
    );

    expect(toMarkdown(table)).toContain(
      "| Release | see \\*this\\* [x](https://example.com/x) a\\|b |"
    );
  });

  it("should leave an autolink, an incomplete link and an anchor without href as text", () => {
    expect(
      toMarkdown(
        buildTable('<a href="https://example.com/x">https://example.com/x</a>')
      )
    ).toContain("| Release | https://example.com/x |");
    expect(
      toMarkdown(
        buildTable('<a href="mailto:ada@example.com">ada@example.com</a>')
      )
    ).toContain("| Release | ada\\@example.com |");
    expect(
      toMarkdown(
        buildTable('<a href="streamdown:incomplete-link">Release no</a>')
      )
    ).toContain("| Release | Release no |");
    expect(toMarkdown(buildTable("<a>anchor</a>"))).toContain(
      "| Release | anchor |"
    );
    expect(
      toMarkdown(
        buildTable('<a href="http://www.example.com/x">www.example.com/x</a>')
      )
    ).toContain("| Release | www.example.com/x |");
  });

  it("should not serialize a bang before a cell link as an image", () => {
    const { container } = render(
      <Streamdown linkSafety={{ enabled: false }}>
        {
          "| Item | Link |\n|---|---|\n| Note | \\![Release](https://example.com/release) |"
        }
      </Streamdown>
    );
    const table = container.querySelector("table") as HTMLTableElement;
    const data = extractTableDataFromElement(table);

    expect(tableDataToMarkdown(data)).toBe(
      "| Item | Link |\n| --- | --- |\n| Note | \\![Release](https://example.com/release) |"
    );
    expect(tableDataToCSV(data)).toBe(
      "Item,Link\nNote,![Release](https://example.com/release)"
    );
    expect(tableDataToTSV(data)).toBe(
      "Item\tLink\nNote\t![Release](https://example.com/release)"
    );
  });

  it("should keep a genuine table image as an image", () => {
    const { container } = render(
      <Streamdown>
        {
          "| Item | Image |\n|---|---|\n| Logo | ![Release](https://example.com/release) |"
        }
      </Streamdown>
    );
    const table = container.querySelector("table") as HTMLTableElement;

    expect(toMarkdown(table)).toBe(
      "| Item | Image |\n| --- | --- |\n| Logo | ![Release](https://example.com/release) |"
    );
  });

  it("should keep the target of a link whose label is a path", () => {
    const { container } = render(
      <Streamdown linkSafety={{ enabled: false }}>
        {"| Item | Link |\n|---|---|\n| Docs | [/docs](/docs) |"}
      </Streamdown>
    );
    const table = container.querySelector("table") as HTMLTableElement;
    const data = extractTableDataFromElement(table);

    expect(tableDataToMarkdown(data)).toBe(
      "| Item | Link |\n| --- | --- |\n| Docs | [/docs](/docs) |"
    );
    expect(tableDataToCSV(data)).toBe("Item,Link\nDocs,[/docs](/docs)");
    expect(tableDataToTSV(data)).toBe("Item\tLink\nDocs\t[/docs](/docs)");
  });
});
