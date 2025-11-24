import { DownloadIcon } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { StreamdownContext } from "../../index";
import { cn, save } from "../utils";
import {
  extractTableDataFromElement,
  tableDataToCSV,
  tableDataToMarkdown,
} from "./utils";

export type TableDownloadButtonProps = {
  children?: React.ReactNode;
  className?: string;
  onDownload?: () => void;
  onError?: (error: Error) => void;
  format?: "csv" | "markdown";
  filename?: string;
};

export const TableDownloadButton = ({
  children,
  className,
  onDownload,
  onError,
  format = "csv",
  filename,
}: TableDownloadButtonProps) => {
  const { isAnimating } = useContext(StreamdownContext);

  const downloadTableData = (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      // Find the closest table element
      const button = event.currentTarget;
      const tableWrapper = button.closest('[data-streamdown="table-wrapper"]');
      const tableElement = tableWrapper?.querySelector(
        "table"
      ) as HTMLTableElement;

      if (!tableElement) {
        onError?.(new Error("Table not found"));
        return;
      }

      const tableData = extractTableDataFromElement(tableElement);
      let content = "";
      let mimeType = "";
      let extension = "";

      switch (format) {
        case "csv":
          content = tableDataToCSV(tableData);
          mimeType = "text/csv";
          extension = "csv";
          break;
        case "markdown":
          content = tableDataToMarkdown(tableData);
          mimeType = "text/markdown";
          extension = "md";
          break;
        default:
          content = tableDataToCSV(tableData);
          mimeType = "text/csv";
          extension = "csv";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename || "table"}.${extension}`;
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
      className={cn(
        "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      disabled={isAnimating}
      onClick={downloadTableData}
      title={`Download table as ${format.toUpperCase()}`}
      type="button"
    >
      {children ?? <DownloadIcon size={14} />}
    </button>
  );
};

export type TableDownloadDropdownProps = {
  children?: React.ReactNode;
  className?: string;
  onDownload?: (format: "csv" | "markdown") => void;
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
  const { isAnimating } = useContext(StreamdownContext);

  const downloadTableData = (format: "csv" | "markdown") => {
    try {
      const tableWrapper = dropdownRef.current?.closest(
        '[data-streamdown="table-wrapper"]'
      );
      const tableElement = tableWrapper?.querySelector(
        "table"
      ) as HTMLTableElement;

      if (!tableElement) {
        onError?.(new Error("Table not found"));
        return;
      }

      const tableData = extractTableDataFromElement(tableElement);
      const content =
        format === "csv"
          ? tableDataToCSV(tableData)
          : tableDataToMarkdown(tableData);
      const extension = format === "csv" ? "csv" : "md";
      const filename = `table.${extension}`;
      const mimeType = format === "csv" ? "text/csv" : "text/markdown";

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={cn(
          "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={isAnimating}
        onClick={() => setIsOpen(!isOpen)}
        title="Download table"
        type="button"
      >
        {children ?? <DownloadIcon size={14} />}
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg">
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={() => downloadTableData("csv")}
            type="button"
            title="Download table as CSV"
          >
            CSV
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={() => downloadTableData("markdown")}
            type="button"
            title="Download table as Markdown"
          >
            Markdown
          </button>
        </div>
      )}
    </div>
  );
};
