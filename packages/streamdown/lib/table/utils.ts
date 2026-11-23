export interface TableData {
  headers: string[];
  rows: string[][];
}

// Alt text is inline Markdown, so it uses the same escapes as a table cell.
// Newlines become spaces because <br> would not be plain alt text.
const escapeImageAlt = (alt: string): string =>
  escapeMarkdownTableCell(alt.replace(/\r?\n/g, " "));

// encodeURIComponent leaves ( and ) alone, but they would end the link early.
// & is backslash-escaped instead of encoded so the query keeps its meaning
// while sequences like &amp; are not decoded as character references.
const imageSrcEscapes: Record<string, string> = {
  "(": "%28",
  ")": "%29",
  "&": "\\&",
};

const encodeImageSrc = (src: string): string =>
  src.replace(
    /[\s()|\\<>&]/g,
    (char) => imageSrcEscapes[char] ?? encodeURIComponent(char)
  );

// Serialises an <img> as Markdown from its attributes, so the result never
// depends on whether the image actually loaded.
const imageToMarkdown = (img: Element): string =>
  `![${escapeImageAlt(img.getAttribute("alt") ?? "")}](${encodeImageSrc(img.getAttribute("src") ?? "")})`;

// Where a real <img> was serialised within a cell's text.
interface CellImage {
  markdown: string;
  start: number;
}

// Remembers where the `![alt](src)` strings in a TableData came from real
// <img> elements (as opposed to literal text), so tableDataToMarkdown can keep
// them unescaped without changing the shape of TableData.
interface TableImages {
  headers: CellImage[][];
  rows: CellImage[][][];
}
const tableImages = new WeakMap<TableData, TableImages>();

interface CellText {
  images: CellImage[];
  text: string;
}

function extractCellText(node: Node, cell: CellText): void {
  if (node.nodeType === Node.TEXT_NODE) {
    cell.text += node.textContent ?? "";
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const element = node as HTMLElement;

  if (element.tagName === "BR") {
    cell.text += "\n";
    return;
  }

  // UI-only fallback ("Image not available"), never part of the content
  if (element.getAttribute("data-streamdown") === "image-fallback") {
    return;
  }

  if (element.tagName === "IMG") {
    if (!element.getAttribute("src")) {
      return;
    }
    const markdown = imageToMarkdown(element);
    cell.images.push({ start: cell.text.length, markdown });
    cell.text += markdown;
    return;
  }

  for (const child of element.childNodes) {
    extractCellText(child, cell);
  }
}

// Extracts a cell's trimmed text and the offsets of its images in that text.
const extractCell = (element: Element): CellText => {
  const cell: CellText = { text: "", images: [] };
  extractCellText(element, cell);
  const text = cell.text.trim();
  // Images never start or end with whitespace, so trimming only shifts them
  const offset = cell.text.length - cell.text.trimStart().length;
  return {
    text,
    images: cell.images.map(({ start, markdown }) => ({
      start: start - offset,
      markdown,
    })),
  };
};

export const extractTableDataFromElement = (
  tableElement: HTMLElement
): TableData => {
  const headers: string[] = [];
  const rows: string[][] = [];
  const imageMap: TableImages = { headers: [], rows: [] };

  // Extract headers
  const headerCells = tableElement.querySelectorAll("thead th");
  for (const cell of headerCells) {
    const { text, images } = extractCell(cell);
    headers.push(text);
    imageMap.headers.push(images);
  }

  // Extract rows
  const bodyRows = tableElement.querySelectorAll("tbody tr");
  for (const row of bodyRows) {
    const rowData: string[] = [];
    const rowImages: CellImage[][] = [];
    // Row headers (<th scope="row">) are content too, so keep them in order
    const cells = row.querySelectorAll("th, td");
    for (const cell of cells) {
      const { text, images } = extractCell(cell);
      rowData.push(text);
      rowImages.push(images);
    }
    rows.push(rowData);
    imageMap.rows.push(rowImages);
  }

  const data: TableData = { headers, rows };
  tableImages.set(data, imageMap);
  return data;
};

export type CSVSeparator = "," | ";" | "\t" | "auto";

export const getTableCsvSeparator = (
  config: boolean | { table?: boolean | { csvSeparator?: CSVSeparator } }
): CSVSeparator => {
  if (typeof config !== "object") {
    return ",";
  }

  const tableConfig = config.table;
  if (typeof tableConfig !== "object") {
    return ",";
  }

  return tableConfig.csvSeparator ?? ",";
};

export const tableDataToCSV = (
  data: TableData,
  separator: CSVSeparator = ","
): string => {
  let resolvedSeparator: string;

  if (separator === "auto") {
    const formatter = Intl.NumberFormat().format(1.1);

    if (formatter.includes(",")) {
      resolvedSeparator = ";";
    } else {
      resolvedSeparator = ",";
    }
  } else {
    resolvedSeparator = separator;
  }
  const { headers, rows } = data;

  const escapeCSV = (value: string): string => {
    let needsEscaping = false;

    for (const char of value) {
      if (
        char === resolvedSeparator ||
        char === '"' ||
        char === "\n" ||
        char === "\r"
      ) {
        needsEscaping = true;
        break;
      }
    }

    if (!needsEscaping) {
      return value;
    }
    // Escape internal quotes by doubling them
    return `"${value.replace(/"/g, '""')}"`;
  };

  // Pre-allocate array with known size
  const totalRows = headers.length > 0 ? rows.length + 1 : rows.length;
  const csvRows: string[] = new Array(totalRows);
  let rowIndex = 0;

  // Add headers
  if (headers.length > 0) {
    csvRows[rowIndex] = headers.map(escapeCSV).join(resolvedSeparator);
    rowIndex += 1;
  }

  // Add data rows
  for (const row of rows) {
    csvRows[rowIndex] = row.map(escapeCSV).join(resolvedSeparator);
    rowIndex += 1;
  }

  return csvRows.join("\n");
};

export const tableDataToTSV = (data: TableData): string => {
  const { headers, rows } = data;

  const escapeTSV = (value: string): string => {
    // OPTIMIZATION: Check characters directly instead of multiple includes() calls
    let needsEscaping = false;
    for (const char of value) {
      if (char === "\t" || char === "\n" || char === "\r") {
        needsEscaping = true;
        break;
      }
    }

    if (!needsEscaping) {
      return value;
    }

    // OPTIMIZATION: Use array building instead of string concatenation for better performance
    const parts: string[] = [];
    for (const char of value) {
      if (char === "\t") {
        parts.push("\\t");
      } else if (char === "\n") {
        parts.push("\\n");
      } else if (char === "\r") {
        parts.push("\\r");
      } else {
        parts.push(char);
      }
    }
    return parts.join("");
  };

  // Pre-allocate array with known size
  const totalRows = headers.length > 0 ? rows.length + 1 : rows.length;
  const tsvRows: string[] = new Array(totalRows);
  let rowIndex = 0;

  // Add headers
  if (headers.length > 0) {
    tsvRows[rowIndex] = headers.map(escapeTSV).join("\t");
    rowIndex += 1;
  }

  // Add data rows
  for (const row of rows) {
    tsvRows[rowIndex] = row.map(escapeTSV).join("\t");
    rowIndex += 1;
  }

  return tsvRows.join("\n");
};

const markdownTableEscapes = new Set([
  "\\",
  "|",
  "`",
  "*",
  "_",
  "~",
  "[",
  "]",
  "$",
  "@",
]);

// Breaking autolink prefixes lets Markdown escapes decode before GFM linkification.
const isAutolinkPrefix = (cell: string, index: number): boolean =>
  (cell[index] === ":" && cell[index + 1] === "/" && cell[index + 2] === "/") ||
  (cell[index] === "." &&
    cell.slice(Math.max(0, index - 3), index).toLowerCase() === "www");

// Helper function to properly escape markdown table cells
// Must escape backslashes first, then pipes to avoid incomplete escaping
export const escapeMarkdownTableCell = (cell: string): string => {
  // OPTIMIZATION: Fast path for cells that don't need escaping - check chars directly
  let needsEscaping = false;
  for (const char of cell) {
    if (
      markdownTableEscapes.has(char) ||
      char === "\n" ||
      char === "&" ||
      char === "<" ||
      char === ">"
    ) {
      needsEscaping = true;
      break;
    }
  }

  if (!needsEscaping) {
    return cell;
  }

  const parts: string[] = [];
  for (let index = 0; index < cell.length; index += 1) {
    const char = cell[index];
    if (markdownTableEscapes.has(char) || isAutolinkPrefix(cell, index)) {
      parts.push(`\\${char}`);
    } else if (char === "\n") {
      parts.push("<br>");
    } else if (char === "&") {
      parts.push("&amp;");
    } else if (char === "<") {
      parts.push("&lt;");
    } else if (char === ">") {
      parts.push("&gt;");
    } else {
      parts.push(char);
    }
  }
  return parts.join("");
};

// Escapes a cell while leaving the given real images (by position) as Markdown.
// Text around the images is escaped piece by piece, so no placeholder is needed.
const escapeCellKeepingImages = (cell: string, images: CellImage[] = []) => {
  if (images.length === 0) {
    return escapeMarkdownTableCell(cell);
  }

  let result = "";
  let position = 0;
  for (const { start, markdown } of images) {
    // Skip images whose position no longer matches (e.g. the cell was edited)
    if (
      start < position ||
      cell.slice(start, start + markdown.length) !== markdown
    ) {
      continue;
    }
    result += escapeMarkdownTableCell(cell.slice(position, start)) + markdown;
    position = start + markdown.length;
  }
  return result + escapeMarkdownTableCell(cell.slice(position));
};

// Bound synchronous serialization before allocating escaped cells or output rows.
// Count synthetic header/separator cells too. The size estimate allows five
// code units per input code unit (the largest escape is & -> &amp;).
const maxMarkdownCells = 100_000;
const maxMarkdownOutputSize = 5_000_000;

const getMarkdownColumnCount = ({ headers, rows }: TableData): number => {
  let cellCount = 0;
  // Four code units per row conservatively covers its edges and newline,
  // including empty rows, which would otherwise bypass a cell-only budget.
  let outputSize = (rows.length + 2) * 4;
  const checkBudget = () => {
    if (
      rows.length > maxMarkdownCells ||
      cellCount > maxMarkdownCells ||
      outputSize > maxMarkdownOutputSize
    ) {
      throw new RangeError("Table is too large to export as Markdown");
    }
  };
  const countRow = (row: string[]) => {
    cellCount += row.length;
    outputSize += row.length * 3;
    checkBudget();
    for (const cell of row) {
      outputSize += cell.length * 5;
      checkBudget();
    }
  };

  countRow(headers);
  let columnCount = headers.length;
  for (const row of rows) {
    countRow(row);
    if (headers.length === 0) {
      columnCount = Math.max(columnCount, row.length);
    }
  }

  cellCount += columnCount * (headers.length === 0 ? 2 : 1);
  outputSize += columnCount * (headers.length === 0 ? 9 : 6);
  checkBudget();
  return columnCount;
};

export const tableDataToMarkdown = (data: TableData) => {
  const { headers, rows } = data;
  const images = tableImages.get(data);

  // A GFM table needs a header row. When the source has none (e.g. a raw HTML
  // table with only a <tbody>), emit an empty one so no cell is lost.
  const columnCount = getMarkdownColumnCount(data);

  if (columnCount === 0) {
    return "";
  }

  // Pre-allocate array with known size (headers + separator + rows)
  const markdownRows: string[] = new Array(rows.length + 2);
  let rowIndex = 0;

  // Add headers (an empty header row when there are none)
  const escapedHeaders = new Array(columnCount);
  for (let i = 0; i < columnCount; i += 1) {
    escapedHeaders[i] =
      i < headers.length
        ? escapeCellKeepingImages(headers[i], images?.headers[i])
        : "";
  }
  markdownRows[rowIndex] = `| ${escapedHeaders.join(" | ")} |`;
  rowIndex += 1;

  // Add separator row
  // OPTIMIZATION: Build separator more efficiently
  const separatorParts = new Array(columnCount);
  for (let i = 0; i < columnCount; i += 1) {
    separatorParts[i] = "---";
  }
  markdownRows[rowIndex] = `| ${separatorParts.join(" | ")} |`;
  rowIndex += 1;

  // Add data rows
  for (const [r, row] of rows.entries()) {
    // GFM fills missing body cells. Padding here would amplify a sparse
    // table into rows.length * columnCount cells on the browser thread.
    const escapedRow = row.map((cell, i) =>
      escapeCellKeepingImages(cell, images?.rows[r]?.[i])
    );
    markdownRows[rowIndex] = `| ${escapedRow.join(" | ")} |`;
    rowIndex += 1;
  }

  return markdownRows.join("\n");
};
