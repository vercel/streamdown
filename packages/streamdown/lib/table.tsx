import { Button } from '@mantine/core';
import { IconCheck, IconCopy, IconDownload } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { save } from './utils';

type TableData = {
  headers: string[];
  rows: string[][];
};

function extractTableDataFromElement(tableElement: HTMLElement): TableData {
  const headers: string[] = [];
  const rows: string[][] = [];

  // Extract headers
  const headerCells = tableElement.querySelectorAll('thead th');
  for (const cell of headerCells) {
    headers.push(cell.textContent?.trim() || '');
  }

  // Extract rows
  const bodyRows = tableElement.querySelectorAll('tbody tr');
  for (const row of bodyRows) {
    const rowData: string[] = [];
    const cells = row.querySelectorAll('td');
    for (const cell of cells) {
      rowData.push(cell.textContent?.trim() || '');
    }
    rows.push(rowData);
  }

  return { headers, rows };
}

function tableDataToCSV(data: TableData): string {
  const { headers, rows } = data;

  const escapeCSV = (value: string): string => {
    // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvRows: string[] = [];

  // Add headers
  if (headers.length > 0) {
    csvRows.push(headers.map(escapeCSV).join(','));
  }

  // Add data rows
  for (const row of rows) {
    csvRows.push(row.map(escapeCSV).join(','));
  }

  return csvRows.join('\n');
}

function tableDataToMarkdown(data: TableData): string {
  const { headers, rows } = data;

  if (headers.length === 0) {
    return '';
  }

  const markdownRows: string[] = [];

  // Add headers
  const escapedHeaders = headers.map((h) => h.replace(/\|/g, '\\|'));
  markdownRows.push(`| ${escapedHeaders.join(' | ')} |`);

  // Add separator row
  markdownRows.push(`| ${headers.map(() => '---').join(' | ')} |`);

  // Add data rows
  for (const row of rows) {
    // Pad row with empty strings if it's shorter than headers
    const paddedRow = [...row];
    while (paddedRow.length < headers.length) {
      paddedRow.push('');
    }
    const escapedRow = paddedRow.map((cell) => cell.replace(/\|/g, '\\|'));
    markdownRows.push(`| ${escapedRow.join(' | ')} |`);
  }

  return markdownRows.join('\n');
}

export type TableCopyButtonProps = {
  children?: React.ReactNode;
  className?: string;
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
  format?: 'csv' | 'markdown' | 'text';
};

export const TableCopyButton = ({
  children,
  className,
  onCopy,
  onError,
  timeout = 2000,
  format = 'markdown',
}: TableCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef(0);

  const copyTableData = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (typeof window === 'undefined' || !navigator?.clipboard?.write) {
      onError?.(new Error('Clipboard API not available'));
      return;
    }

    try {
      if (!isCopied) {
        // Find the closest table element
        const button = event.currentTarget;
        const tableWrapper = button.closest(
          '[data-streamdown="table-wrapper"]',
        );
        const tableElement = tableWrapper?.querySelector(
          'table',
        ) as HTMLTableElement;

        if (!tableElement) {
          onError?.(new Error('Table not found'));
          return;
        }

        const tableData = extractTableDataFromElement(tableElement);
        const clipboardItemData = new ClipboardItem({
          'text/plain':
            format === 'markdown'
              ? tableDataToMarkdown(tableData)
              : tableDataToCSV(tableData),
          'text/html': new Blob([tableElement.outerHTML], {
            type: 'text/html',
          }),
        });

        await navigator.clipboard.write([clipboardItemData]);
        setIsCopied(true);
        onCopy?.();
        timeoutRef.current = window.setTimeout(
          () => setIsCopied(false),
          timeout,
        );
      }
    } catch (error) {
      onError?.(error as Error);
    }
  };

  useEffect(() => {
    return () => {
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const Icon = isCopied ? IconCheck : IconCopy;

  return (
    <Button
      size="xs"
      // _hover={{ bg: 'bg.accent' }}
      // _active={{ bg: 'icon.bg.active!' }}
      // transition="all"
      onClick={copyTableData}
      title={`Скопировать таблицу как ${format}`}
      className={className}
    >
      {children ?? <Icon />}
    </Button>
  );
};

export type TableDownloadButtonProps = {
  children?: React.ReactNode;
  className?: string;
  onDownload?: () => void;
  onError?: (error: Error) => void;
  format?: 'csv' | 'markdown';
  filename?: string;
};

export const TableDownloadButton = ({
  children,
  className,
  onDownload,
  onError,
  format = 'csv',
  filename,
}: TableDownloadButtonProps) => {
  const downloadTableData = (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      // Find the closest table element
      const button = event.currentTarget;
      const tableWrapper = button.closest('[data-streamdown="table-wrapper"]');
      const tableElement = tableWrapper?.querySelector(
        'table',
      ) as HTMLTableElement;

      if (!tableElement) {
        onError?.(new Error('Table not found'));
        return;
      }

      const tableData = extractTableDataFromElement(tableElement);
      let content = '';
      let mimeType = '';
      let extension = '';

      switch (format) {
        case 'csv':
          content = tableDataToCSV(tableData);
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        case 'markdown':
          content = tableDataToMarkdown(tableData);
          mimeType = 'text/markdown';
          extension = 'md';
          break;
        default:
          content = tableDataToCSV(tableData);
          mimeType = 'text/csv';
          extension = 'csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename || 'table'}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onDownload?.();
    } catch (error) {
      onError?.(error as Error);
    }
  };

  return (
    <button
      className={className}
      // className={cx(
      //   // 'cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground',
      //   css({
      //     cursor: 'button',
      //     p: '1',
      //     c: 'fg.muted',
      //     transition: 'all',
      //     _hover: { c: 'fg' },
      //   }),
      //   className,
      // )}
      onClick={downloadTableData}
      title={`Скопировать таблицу как ${format.toUpperCase()}`}
      type="button"
    >
      {children ?? <IconDownload size={14} />}
    </button>
  );
};

export type TableDownloadDropdownProps = {
  children?: React.ReactNode;
  className?: string;
  onDownload?: (format: 'csv' | 'markdown') => void;
  onError?: (error: Error) => void;
};

export const TableDownloadDropdown = ({
  children,
  className,
  onDownload,
  onError,
}: TableDownloadDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const downloadTableData = (format: 'csv' | 'markdown') => {
    try {
      const tableWrapper = dropdownRef.current?.closest(
        '[data-streamdown="table-wrapper"]',
      );
      const tableElement = tableWrapper?.querySelector(
        'table',
      ) as HTMLTableElement;

      if (!tableElement) {
        onError?.(new Error('Table not found'));
        return;
      }

      const tableData = extractTableDataFromElement(tableElement);
      const content =
        format === 'csv'
          ? tableDataToCSV(tableData)
          : tableDataToMarkdown(tableData);
      const extension = format === 'csv' ? 'csv' : 'md';
      const filename = `table.${extension}`;
      const mimeType = format === 'csv' ? 'text/csv' : 'text/markdown';

      save(filename, content, mimeType);
      setIsOpen(false);
      onDownload?.(format);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      // className={css({ pos: 'relative' })}
      ref={dropdownRef}
    >
      <button
        className={className}
        // className={cx(
        //   // 'cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground',
        //   css({
        //     cursor: 'pointer',
        //     p: 1,
        //     color: 'text.muted',
        //     transition: 'all',
        //     _hover: { color: 'text' },
        //   }),
        //   className,
        // )}
        onClick={() => setIsOpen(!isOpen)}
        title="Скопировать таблицу"
        type="button"
      >
        {children ?? <IconDownload size={14} />}
      </button>
      {isOpen && (
        //"absolute top-full right-0 z-10 mt-1 min-w-[120px] rounded-md border border-border bg-background shadow-lg"
        <div
        // className={css({
        //   pos: 'absolute',
        //   top: 'full',
        //   right: 0,
        //   zIndex: 10,
        //   mt: 1,
        //   minW: '120px',
        //   rounded: 'md',
        //   borderColor: 'border',
        //   bg: 'bg',
        //   shadow: 'lg',
        // })}
        >
          {/*"w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"*/}
          <button
            // className={css({
            //   w: 'full',
            //   px: 3,
            //   py: 2,
            //   textAlign: 'left',
            //   textStyle: 'p4',
            //   transition: 'colors',
            //   _hover: { bg: 'bg/40' },
            // })}
            onClick={() => downloadTableData('csv')}
            type="button"
          >
            CSV
          </button>
          <button
            //"w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            // className={css({
            //   w: 'full',
            //   px: 3,
            //   py: 2,
            //   textAlign: 'left',
            //   textStyle: 'p4',
            //   transition: 'colors',
            //   _hover: { bg: 'bg/40' },
            // })}
            onClick={() => downloadTableData('markdown')}
            type="button"
          >
            Markdown
          </button>
        </div>
      )}
    </div>
  );
};
