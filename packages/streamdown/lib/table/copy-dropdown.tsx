import { useContext, useEffect, useRef, useState } from "react";
import { StreamdownContext } from "../../index";
import { CheckIcon, CopyIcon } from "../icons";
import { cn } from "../utils";
import {
  extractTableDataFromElement,
  tableDataToCSV,
  tableDataToMarkdown,
  tableDataToTSV,
} from "./utils";

export interface TableCopyDropdownProps {
  children?: React.ReactNode;
  className?: string;
  onCopy?: (format: "csv" | "tsv" | "md") => void;
  onError?: (error: Error) => void;
  timeout?: number;
}

export const TableCopyDropdown = ({
  children,
  className,
  onCopy,
  onError,
  timeout = 2000,
}: TableCopyDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef(0);
  const { isAnimating } = useContext(StreamdownContext);

  const copyTableData = async (format: "csv" | "tsv" | "md") => {
    if (typeof window === "undefined" || !navigator?.clipboard?.write) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

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
      
      const formatters = {
        csv: tableDataToCSV,
        tsv: tableDataToTSV,
        md: tableDataToMarkdown,
      };
      const formatter = formatters[format] || tableDataToMarkdown;
      const content = formatter(tableData)

      const clipboardItemData = new ClipboardItem({
        "text/plain": new Blob([content], { type: "text/plain" }),
        "text/html": new Blob([tableElement.outerHTML], {
          type: "text/html",
        }),
      });

      await navigator.clipboard.write([clipboardItemData]);
      setIsCopied(true);
      setIsOpen(false);
      onCopy?.(format);
      timeoutRef.current = window.setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const path = event.composedPath();
      if (dropdownRef.current && !path.includes(dropdownRef.current)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={cn(
          "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={isAnimating}
        onClick={() => setIsOpen(!isOpen)}
        title="Copy table"
        type="button"
      >
        {children ?? <Icon size={14} />}
      </button>
      {isOpen ? (
        <div className="absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg">
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={() => copyTableData("md")}
            title="Copy table as Markdown"
            type="button"
          >
            Markdown
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={() => copyTableData("csv")}
            title="Copy table as CSV"
            type="button"
          >
            CSV
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={() => copyTableData("tsv")}
            title="Copy table as TSV"
            type="button"
          >
            TSV
          </button>
        </div>
      ) : null}
    </div>
  );
};
