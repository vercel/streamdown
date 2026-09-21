import { test } from "vitest";
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

test("tableDataToCSV", async ({ bench }) => {
  await bench("simple table (3x3)", () => {
    tableDataToCSV(simpleTable);
  }).run();

  await bench("large table (100 rows x 8 cols)", () => {
    tableDataToCSV(largeTable);
  }).run();

  await bench("table with complex data", () => {
    tableDataToCSV(tableWithComplexData);
  }).run();

  await bench("wide table (20 columns)", () => {
    tableDataToCSV(wideTable);
  }).run();
});

test("tableDataToTSV", async ({ bench }) => {
  await bench("simple table (3x3)", () => {
    tableDataToTSV(simpleTable);
  }).run();

  await bench("large table (100 rows x 8 cols)", () => {
    tableDataToTSV(largeTable);
  }).run();

  await bench("table with complex data", () => {
    tableDataToTSV(tableWithComplexData);
  }).run();

  await bench("wide table (20 columns)", () => {
    tableDataToTSV(wideTable);
  }).run();
});

test("tableDataToMarkdown", async ({ bench }) => {
  await bench("simple table (3x3)", () => {
    tableDataToMarkdown(simpleTable);
  }).run();

  await bench("large table (100 rows x 8 cols)", () => {
    tableDataToMarkdown(largeTable);
  }).run();

  await bench("table with complex data", () => {
    tableDataToMarkdown(tableWithComplexData);
  }).run();

  await bench("wide table (20 columns)", () => {
    tableDataToMarkdown(wideTable);
  }).run();
});

test("Format conversion comparison", async ({ bench }) => {
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

  await bench("CSV conversion (50 rows)", () => {
    tableDataToCSV(mediumTable);
  }).run();

  await bench("TSV conversion (50 rows)", () => {
    tableDataToTSV(mediumTable);
  }).run();

  await bench("Markdown conversion (50 rows)", () => {
    tableDataToMarkdown(mediumTable);
  }).run();
});

test("Table data edge cases", async ({ bench }) => {
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

  await bench("table with empty cells (CSV)", () => {
    tableDataToCSV(tableWithEmptyCells);
  }).run();

  await bench("table with empty cells (TSV)", () => {
    tableDataToTSV(tableWithEmptyCells);
  }).run();

  await bench("table with special chars (CSV)", () => {
    tableDataToCSV(tableWithSpecialChars);
  }).run();

  await bench("table with special chars (Markdown)", () => {
    tableDataToMarkdown(tableWithSpecialChars);
  }).run();
});
