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
    const needsEscaping = value.includes(",") || value.includes('"') || value.includes("\n");
    if (!needsEscaping) {
      return value;
    }
    // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    // OPTIMIZATION: Only replace quotes if the value contains them
    if (value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return `"${value}"`;
  };

  const csvRows: string[] = [];

  // Add headers
  if (headers.length > 0) {
    csvRows.push(headers.map(escapeCSV).join(","));
  }

  // Add data rows
  for (const row of rows) {
    csvRows.push(row.map(escapeCSV).join(","));
  }

  return csvRows.join("\n");
};

export const tableDataToTSV = (data: TableData): string => {
  const { headers, rows } = data;

  const escapeTSV = (value: string): string => {
    // OPTIMIZATION: Only escape if necessary to avoid regex cost
    if (!value.includes("\t") && !value.includes("\n") && !value.includes("\r")) {
      return value;
    }
    // Escape tabs, newlines, and carriage returns
    return value
      .replace(/\t/g, "\\t")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");
  };

  const tsvRows: string[] = [];

  // Add headers
  if (headers.length > 0) {
    tsvRows.push(headers.map(escapeTSV).join("\t"));
  }

  // Add data rows
  for (const row of rows) {
    tsvRows.push(row.map(escapeTSV).join("\t"));
  }

  return tsvRows.join("\n");
};

// Helper function to properly escape markdown table cells
// Must escape backslashes first, then pipes to avoid incomplete escaping
export const escapeMarkdownTableCell = (cell: string): string => {
  // OPTIMIZATION: Fast path for cells that don't need escaping
  if (!cell.includes("\\") && !cell.includes("|")) {
    return cell;
  }
  return cell.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
};

export const tableDataToMarkdown = (data: TableData) => {
  const { headers, rows } = data;

  if (headers.length === 0) {
    return "";
  }

  const markdownRows: string[] = [];

  // Add headers
  const escapedHeaders = headers.map((h) => escapeMarkdownTableCell(h));
  markdownRows.push(`| ${escapedHeaders.join(" | ")} |`);

  // Add separator row
  // OPTIMIZATION: Build separator once instead of mapping over headers
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  markdownRows.push(separator);

  // Add data rows
  for (const row of rows) {
    // Pad row with empty strings if it's shorter than headers
    // OPTIMIZATION: Only pad if necessary
    if (row.length < headers.length) {
      const paddedRow = [...row];
      while (paddedRow.length < headers.length) {
        paddedRow.push("");
      }
      const escapedRow = paddedRow.map((cell) => escapeMarkdownTableCell(cell));
      markdownRows.push(`| ${escapedRow.join(" | ")} |`);
    } else {
      const escapedRow = row.map((cell) => escapeMarkdownTableCell(cell));
      markdownRows.push(`| ${escapedRow.join(" | ")} |`);
    }
  }

  return markdownRows.join("\n");
};
