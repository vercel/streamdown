import type { ComponentProps } from "react";
import { useCn } from "../prefix-context";
import { TableCopyDropdown } from "./copy-dropdown";
import { TableDownloadDropdown } from "./download-dropdown";

type TableProps = ComponentProps<"table"> & {
  showControls?: boolean;
};

export const Table = ({
  children,
  className,
  showControls,
  ...props
}: TableProps) => {
  const cn = useCn();
  return (
    <div
      className={cn(
        "my-4 flex flex-col gap-2 rounded-lg border border-border bg-sidebar p-2"
      )}
      data-streamdown="table-wrapper"
    >
      {showControls ? (
        <div className={cn("flex items-center justify-end gap-1")}>
          <TableCopyDropdown />
          <TableDownloadDropdown />
        </div>
      ) : null}
      <div
        className={cn(
          "border-collapse overflow-x-auto overscroll-y-auto rounded-md border border-border bg-background"
        )}
      >
        <table
          className={cn("w-full divide-y divide-border", className)}
          data-streamdown="table"
          {...props}
        >
          {children}
        </table>
      </div>
    </div>
  );
};
