import { bench, describe } from "vitest";
import {
  type TableData,
  tableDataToCSV,
  tableDataToMarkdown,
  tableDataToTSV,
} from "../lib/table/utils";

const simpleTable: TableData = {
  headers: ["Name", "Age", "City"],
  rows: [
    ["John", "30", "NYC"],
    ["Jane", "25", "LA"],
  ],
};

const largeTable: TableData = {
  headers: ["ID", "Name", "Email", "Phone", "Address", "City", "State", "ZIP"],
  rows: Array.from({ length: 100 }, (_, i) => [
    String(i),
    `User${i}`,
    `user${i}@example.com`,
    `555-${String(i).padStart(4, "0")}`,
    `${i} Main St`,
    `City${i}`,
    "ST",
    String(10_000 + i),
  ]),
};

const tableWithComplexData: TableData = {
  headers: ["Product", "Price", "Description", "Stock"],
  rows: [
    ["Widget A", "$19.99", 'A cool widget with "quotes"', "100"],
    ["Gadget B", "$29.99", "Has, commas, in text", "50"],
    ["Tool C", "$39.99", "Line\nbreaks are tricky", "25"],
  ],
};

const wideTable: TableData = {
  headers: Array.from({ length: 20 }, (_, i) => `Col${i}`),
  rows: [Array.from({ length: 20 }, (_, i) => `Val${i}`)],
};

describe("tableDataToCSV", () => {
  bench("simple table (3x3)", () => {
    tableDataToCSV(simpleTable);
  });

  bench("large table (100 rows x 8 cols)", () => {
    tableDataToCSV(largeTable);
  });

  bench("table with complex data", () => {
    tableDataToCSV(tableWithComplexData);
  });

  bench("wide table (20 columns)", () => {
    tableDataToCSV(wideTable);
  });
});

describe("tableDataToTSV", () => {
  bench("simple table (3x3)", () => {
    tableDataToTSV(simpleTable);
  });

  bench("large table (100 rows x 8 cols)", () => {
    tableDataToTSV(largeTable);
  });

  bench("table with complex data", () => {
    tableDataToTSV(tableWithComplexData);
  });

  bench("wide table (20 columns)", () => {
    tableDataToTSV(wideTable);
  });
});

describe("tableDataToMarkdown", () => {
  bench("simple table (3x3)", () => {
    tableDataToMarkdown(simpleTable);
  });

  bench("large table (100 rows x 8 cols)", () => {
    tableDataToMarkdown(largeTable);
  });

  bench("table with complex data", () => {
    tableDataToMarkdown(tableWithComplexData);
  });

  bench("wide table (20 columns)", () => {
    tableDataToMarkdown(wideTable);
  });
});

describe("Format conversion comparison", () => {
  const mediumTable: TableData = {
    headers: ["A", "B", "C", "D", "E"],
    rows: Array.from({ length: 50 }, (_, i) => [
      `${i}a`,
      `${i}b`,
      `${i}c`,
      `${i}d`,
      `${i}e`,
    ]),
  };

  bench("CSV conversion (50 rows)", () => {
    tableDataToCSV(mediumTable);
  });

  bench("TSV conversion (50 rows)", () => {
    tableDataToTSV(mediumTable);
  });

  bench("Markdown conversion (50 rows)", () => {
    tableDataToMarkdown(mediumTable);
  });
});

describe("Table data edge cases", () => {
  const tableWithEmptyCells: TableData = {
    headers: ["A", "B", "C"],
    rows: [
      ["1", "", "3"],
      ["", "2", ""],
    ],
  };

  const _tableWithExtraSpaces: TableData = {
    headers: ["Name", "Age", "City"],
    rows: [["John", "30", "NYC"]],
  };

  const tableWithSpecialChars: TableData = {
    headers: ["Text", "Value"],
    rows: [["Has | pipe", "123"]],
  };

  bench("table with empty cells (CSV)", () => {
    tableDataToCSV(tableWithEmptyCells);
  });

  bench("table with empty cells (TSV)", () => {
    tableDataToTSV(tableWithEmptyCells);
  });

  bench("table with special chars (CSV)", () => {
    tableDataToCSV(tableWithSpecialChars);
  });

  bench("table with special chars (Markdown)", () => {
    tableDataToMarkdown(tableWithSpecialChars);
  });
});
