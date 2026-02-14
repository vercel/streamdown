import { useContext, useEffect, useState } from "react";
import { StreamdownContext } from "../../index";
import { Maximize2Icon, XIcon } from "../icons";
import { lockBodyScroll, unlockBodyScroll } from "../scroll-lock";
import { cn } from "../utils";
import { TableCopyDropdown } from "./copy-dropdown";
import { TableDownloadDropdown } from "./download-dropdown";

interface TableFullscreenButtonProps {
  children: React.ReactNode;
  className?: string;
  showCopy?: boolean;
  showDownload?: boolean;
}

export const TableFullscreenButton = ({
  children,
  className,
  showCopy = true,
  showDownload = true,
}: TableFullscreenButtonProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isAnimating } = useContext(StreamdownContext);

  const handleToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    if (isFullscreen) {
      lockBodyScroll();

      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsFullscreen(false);
        }
      };

      document.addEventListener("keydown", handleEsc);
      return () => {
        document.removeEventListener("keydown", handleEsc);
        unlockBodyScroll();
      };
    }
  }, [isFullscreen]);

  return (
    <>
      <button
        className={cn(
          "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={isAnimating}
        onClick={handleToggle}
        title="View fullscreen"
        type="button"
      >
        <Maximize2Icon size={14} />
      </button>

      {isFullscreen ? (
        // biome-ignore lint/a11y/useSemanticElements: "div is used as a backdrop overlay, not a button"
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background"
          data-streamdown="table-fullscreen"
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleToggle();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-end gap-1 p-4">
            {showCopy ? <TableCopyDropdown /> : null}
            {showDownload ? <TableDownloadDropdown /> : null}
            <button
              className="rounded-md p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              onClick={handleToggle}
              title="Exit fullscreen"
              type="button"
            >
              <XIcon size={20} />
            </button>
          </div>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: "div with role=presentation is used for event propagation control" */}
          <div
            className="flex-1 overflow-auto p-4 pt-0 [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <table
              className="w-full border-collapse border border-border"
              data-streamdown="table"
            >
              {children}
            </table>
          </div>
        </div>
      ) : null}
    </>
  );
};
