import { type ComponentProps, useContext } from "react";
import { StreamdownContext } from "../../index";
import { useCn } from "../prefix-context";
import { resolveMaxHeight, usePinnedScroll } from "../use-pinned-scroll";
import { TableCopyDropdown } from "./copy-dropdown";
import { TableDownloadDropdown } from "./download-dropdown";
import { TableFullscreenButton } from "./fullscreen-button";

type TableProps = ComponentProps<"table"> & {
  maxHeight?: number | string;
  showControls?: boolean;
  showCopy?: boolean;
  showDownload?: boolean;
  showFullscreen?: boolean;
};

export const Table = ({
  children,
  className,
  maxHeight,
  showControls,
  showCopy = true,
  showDownload = true,
  showFullscreen = true,
  ...props
}: TableProps) => {
  const cn = useCn();
  const { isAnimating } = useContext(StreamdownContext);
  const maxHeightStyle = resolveMaxHeight(maxHeight);
  const scrollRef = usePinnedScroll(
    isAnimating,
    Boolean(maxHeightStyle),
    children
  );

  const hasCopy = showControls && showCopy;
  const hasDownload = showControls && showDownload;
  const hasFullscreen = showControls && showFullscreen;
  const hasAnyControl = hasCopy || hasDownload || hasFullscreen;

  return (
    <div
      className={cn(
        "my-4 flex flex-col gap-2 rounded-lg border border-border bg-sidebar p-2"
      )}
      data-streamdown="table-wrapper"
    >
      {hasAnyControl ? (
        <div className={cn("flex items-center justify-end gap-1")}>
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
      <div
        className={cn(
          "border-collapse overflow-x-auto overflow-y-auto rounded-md border border-border bg-background"
        )}
        ref={scrollRef}
        style={maxHeightStyle ? { maxHeight: maxHeightStyle } : undefined}
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
