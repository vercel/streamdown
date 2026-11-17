export interface TableData {
  headers: string[];
  rows: string[][];
}

const IMAGE_START = "\uE000";
const IMAGE_END = "\uE001";

const escapeImageAlt = (alt: string): string =>
  alt.replace(/[\\[\]|]/g, (char) => `\\${char}`).replace(/\n/g, " ");

const encodeImageSrc = (src: string): string =>
  src.replace(/[\s()|]/g, (char) =>
    char === "(" ? "%28" : char === ")" ? "%29" : encodeURIComponent(char)
  );

// Serialises an <img> as Markdown from its attributes, so the result never
// depends on whether the image actually loaded.
const imageToMarkdown = (img: Element): string =>
  `![${escapeImageAlt(img.getAttribute("alt") ?? "")}](${encodeImageSrc(img.getAttribute("src") ?? "")})`;

// Remembers which `![alt](src)` strings in a TableData came from real <img>
// elements (as opposed to literal text), so tableDataToMarkdown can keep them
// unescaped without changing the shape of TableData.
interface TableImages {
  headers: string[][];
  rows: string[][][];
}
const tableImages = new WeakMap<TableData, TableImages>();

function extractCellText(node: Node, images: string[]): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as HTMLElement;

  if (element.tagName === "BR") {
    return "\n";
  }

  // UI-only fallback ("Image not available"), never part of the content
  if (element.getAttribute("data-streamdown") === "image-fallback") {
    return "";
  }

  if (element.tagName === "IMG") {
    if (!element.getAttribute("src")) {
      return "";
    }
    const markdown = imageToMarkdown(element);
    images.push(markdown);
    return markdown;
  }

  return Array.from(element.childNodes)
    .map((child) => extractCellText(child, images))
    .join("");
}

export const extractTableDataFromElement = (
  tableElement: HTMLElement
): TableData => {
  const headers: string[] = [];
  const rows: string[][] = [];
  const imageMap: TableImages = { headers: [], rows: [] };

  // Extract headers
  const headerCells = tableElement.querySelectorAll("thead th");
  for (const cell of headerCells) {
    const images: string[] = [];
    headers.push(extractCellText(cell, images).trim());
    imageMap.headers.push(images);
  }

  // Extract rows
  const bodyRows = tableElement.querySelectorAll("tbody tr");
  for (const row of bodyRows) {
    const rowData: string[] = [];
    const rowImages: string[][] = [];
    // Row headers (<th scope="row">) are content too, so keep them in order
    const cells = row.querySelectorAll("th, td");
    for (const cell of cells) {
      const images: string[] = [];
      rowData.push(extractCellText(cell, images).trim());
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

const imagePlaceholderPattern = new RegExp(
  `${IMAGE_START}(\\d+)${IMAGE_END}`,
  "g"
);

// Escapes a cell while leaving the given real images (in order) as Markdown.
const escapeCellKeepingImages = (cell: string, images: string[] = []) => {
  if (images.length === 0) {
    return escapeMarkdownTableCell(cell);
  }

  let rest = cell;
  let text = "";
  const kept: string[] = [];
  for (const image of images) {
    const at = rest.indexOf(image);
    if (at === -1) {
      continue;
    }
    text += `${rest.slice(0, at)}${IMAGE_START}${kept.length}${IMAGE_END}`;
    kept.push(image);
    rest = rest.slice(at + image.length);
  }
  text += rest;

  return escapeMarkdownTableCell(text).replace(
    imagePlaceholderPattern,
    (match, index) => kept[Number(index)] ?? match
  );
};

export const tableDataToMarkdown = (data: TableData) => {
  const { headers, rows } = data;
  const images = tableImages.get(data);

  // A GFM table needs a header row. When the source has none (e.g. a raw HTML
  // table with only a <tbody>), emit an empty one so no cell is lost.
  const hasHeaders = headers.length > 0;
  let columnCount = headers.length;
  if (!hasHeaders) {
    for (const row of rows) {
      columnCount = Math.max(columnCount, row.length);
    }
  }

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
    // Pad row with empty strings if it's shorter than the column count
    // OPTIMIZATION: Only pad if necessary
    if (row.length < columnCount) {
      const paddedRow = new Array(columnCount);
      for (let i = 0; i < columnCount; i += 1) {
        paddedRow[i] =
          i < row.length
            ? escapeCellKeepingImages(row[i], images?.rows[r]?.[i])
            : "";
      }
      markdownRows[rowIndex] = `| ${paddedRow.join(" | ")} |`;
      rowIndex += 1;
    } else {
      const escapedRow = row.map((cell, i) =>
        escapeCellKeepingImages(cell, images?.rows[r]?.[i])
      );
      markdownRows[rowIndex] = `| ${escapedRow.join(" | ")} |`;
      rowIndex += 1;
    }
  }

  return markdownRows.join("\n");
};
