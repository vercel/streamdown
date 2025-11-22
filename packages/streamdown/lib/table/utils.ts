export type TableData = {
  headers: string[];
  rows: string[][];
};

export const extractTableDataFromElement = (
  tableElement: HTMLElement
): TableData => {
  const headers: string[] = [];
  const rows: string[][] = [];

  // Extract headers
  const headerCells = tableElement.querySelectorAll("thead th");
  for (const cell of headerCells) {
    headers.push(cell.textContent?.trim() || "");
  }

  // Extract rows
  const bodyRows = tableElement.querySelectorAll("tbody tr");
  for (const row of bodyRows) {
    const rowData: string[] = [];
    const cells = row.querySelectorAll("td");
    for (const cell of cells) {
      rowData.push(cell.textContent?.trim() || "");
    }
    rows.push(rowData);
  }

  return { headers, rows };
};

export const tableDataToCSV = (data: TableData): string => {
  const { headers, rows } = data;

  const escapeCSV = (value: string): string => {
    // OPTIMIZATION: Fast path for values that don't need escaping
    // Check characters directly to avoid multiple string scans
    let needsEscaping = false;
    let hasQuote = false;

    // biome-ignore lint/style/useForOf: "Need index access to check character codes for performance"
    for (let i = 0; i < value.length; i += 1) {
      const char = value[i];
      if (char === '"') {
        needsEscaping = true;
        hasQuote = true;
        break;
      }
      if (char === "," || char === "\n") {
        needsEscaping = true;
      }
    }

    if (!needsEscaping) {
      return value;
    }

    // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (hasQuote) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return `"${value}"`;
  };

  // Pre-allocate array with known size
  const totalRows = headers.length > 0 ? rows.length + 1 : rows.length;
  const csvRows: string[] = new Array(totalRows);
  let rowIndex = 0;

  // Add headers
  if (headers.length > 0) {
    csvRows[rowIndex] = headers.map(escapeCSV).join(",");
    rowIndex += 1;
  }

  // Add data rows
  for (const row of rows) {
    csvRows[rowIndex] = row.map(escapeCSV).join(",");
    rowIndex += 1;
  }

  return csvRows.join("\n");
};

export const tableDataToTSV = (data: TableData): string => {
  const { headers, rows } = data;

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "TSV escaping requires character-by-character inspection"
  const escapeTSV = (value: string): string => {
    // OPTIMIZATION: Check characters directly instead of multiple includes() calls
    let needsEscaping = false;
    // biome-ignore lint/style/useForOf: "Need index access to check character codes for performance"
    for (let i = 0; i < value.length; i += 1) {
      const char = value[i];
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
    // biome-ignore lint/style/useForOf: "Need index access to check character codes for performance"
    for (let i = 0; i < value.length; i += 1) {
      const char = value[i];
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

// Helper function to properly escape markdown table cells
// Must escape backslashes first, then pipes to avoid incomplete escaping
export const escapeMarkdownTableCell = (cell: string): string => {
  // OPTIMIZATION: Fast path for cells that don't need escaping - check chars directly
  let needsEscaping = false;
  // biome-ignore lint/style/useForOf: "Need index access to check character codes for performance"
  for (let i = 0; i < cell.length; i += 1) {
    const char = cell[i];
    if (char === "\\" || char === "|") {
      needsEscaping = true;
      break;
    }
  }

  if (!needsEscaping) {
    return cell;
  }

  // OPTIMIZATION: Use array building instead of string concatenation for better performance
  const parts: string[] = [];
  // biome-ignore lint/style/useForOf: "Need index access to check character codes for performance"
  for (let i = 0; i < cell.length; i += 1) {
    const char = cell[i];
    if (char === "\\") {
      parts.push("\\\\");
    } else if (char === "|") {
      parts.push("\\|");
    } else {
      parts.push(char);
    }
  }
  return parts.join("");
};

export const tableDataToMarkdown = (data: TableData) => {
  const { headers, rows } = data;

  if (headers.length === 0) {
    return "";
  }

  // Pre-allocate array with known size (headers + separator + rows)
  const markdownRows: string[] = new Array(rows.length + 2);
  let rowIndex = 0;

  // Add headers
  const escapedHeaders = headers.map((h) => escapeMarkdownTableCell(h));
  markdownRows[rowIndex] = `| ${escapedHeaders.join(" | ")} |`;
  rowIndex += 1;

  // Add separator row
  // OPTIMIZATION: Build separator more efficiently
  const separatorParts = new Array(headers.length);
  for (let i = 0; i < headers.length; i += 1) {
    separatorParts[i] = "---";
  }
  markdownRows[rowIndex] = `| ${separatorParts.join(" | ")} |`;
  rowIndex += 1;

  // Add data rows
  for (const row of rows) {
    // Pad row with empty strings if it's shorter than headers
    // OPTIMIZATION: Only pad if necessary
    if (row.length < headers.length) {
      const paddedRow = new Array(headers.length);
      for (let i = 0; i < headers.length; i += 1) {
        paddedRow[i] = i < row.length ? escapeMarkdownTableCell(row[i]) : "";
      }
      markdownRows[rowIndex] = `| ${paddedRow.join(" | ")} |`;
      rowIndex += 1;
    } else {
      const escapedRow = row.map((cell) => escapeMarkdownTableCell(cell));
      markdownRows[rowIndex] = `| ${escapedRow.join(" | ")} |`;
      rowIndex += 1;
    }
  }

  return markdownRows.join("\n");
};
