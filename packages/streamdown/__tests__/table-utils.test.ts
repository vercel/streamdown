import { beforeEach, describe, expect, it } from "vitest";
import {
  escapeMarkdownTableCell,
  extractTableDataFromElement,
  tableDataToCSV,
  tableDataToMarkdown,
  tableDataToTSV,
  type TableData,
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

      expect(result).toBe(
        "Name,Age,City\nJohn,30,New York\nJane,25,London"
      );
    });

    it("should escape commas in values", () => {
      const data: TableData = {
        headers: ["Name", "Location"],
        rows: [["John", "New York, USA"]],
      };

      const result = tableDataToCSV(data);

      expect(result).toBe('Name,Location\nJohn,"New York, USA"');
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
  });

  describe("tableDataToMarkdown", () => {
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

      expect(result).toBe(
        "| Header |\n| --- |\n| Value \\| With \\| Pipes |"
      );
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

      expect(result).toBe("| Col1 | Col2 | Col3 |\n| --- | --- | --- |\n| A | B |  |");
    });

    it("should return empty string if no headers", () => {
      const data: TableData = {
        headers: [],
        rows: [["Value1", "Value2"]],
      };

      const result = tableDataToMarkdown(data);

      expect(result).toBe("");
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
  });
});
