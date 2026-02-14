import type { ComponentProps } from "react";
import { cn } from "../utils";
import { TableCopyDropdown } from "./copy-dropdown";
import { TableDownloadDropdown } from "./download-dropdown";
import { TableFullscreenButton } from "./fullscreen-button";

type TableProps = ComponentProps<"table"> & {
  showControls?: boolean;
  showCopy?: boolean;
  showDownload?: boolean;
  showFullscreen?: boolean;
};

export const Table = ({
  children,
  className,
  showControls,
  showCopy = true,
  showDownload = true,
  showFullscreen = true,
  ...props
}: TableProps) => {
  const hasCopy = showControls && showCopy;
  const hasDownload = showControls && showDownload;
  const hasFullscreen = showControls && showFullscreen;
  const hasAnyControl = hasCopy || hasDownload || hasFullscreen;

  return (
    <div className="my-4 flex flex-col space-y-2" data-streamdown="table-wrapper">
      {hasAnyControl ? (
        <div className="flex items-center justify-end gap-1">
          {hasCopy ? <TableCopyDropdown /> : null}
          {hasDownload ? <TableDownloadDropdown /> : null}
          {hasFullscreen ? (
            <TableFullscreenButton
              showCopy={hasCopy}
              showDownload={hasDownload}
            >
              {children}
            </TableFullscreenButton>
          ) : null}
        </div>
      ) : null}
      <div className="overflow-x-auto overscroll-y-auto">
        <table
          className={cn("w-full border-collapse border border-border", className)}
          data-streamdown="table"
          {...props}
        >
          {children}
        </table>
      </div>
    </div>
  );
};
