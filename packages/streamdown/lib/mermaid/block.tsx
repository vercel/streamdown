import { CodeBlockCopyButton } from "../code-block/copy-button";
import type { MermaidConfig } from "../plugin-types";
import { useCn } from "../prefix-context";
import { Mermaid } from ".";
import { MermaidDownloadDropdown } from "./download-button";
import { MermaidFullscreenButton } from "./fullscreen-button";

interface MermaidBlockProps {
  chart: string;
  className?: string;
  config?: MermaidConfig;
  copyCallbacks: { onCopy?: () => void; onError?: (error: Error) => void };
  showControls: boolean;
  showCopy: boolean;
  showDownload: boolean;
  showFullscreen: boolean;
  showPanZoomControls: boolean;
}

export const MermaidBlock = ({
  chart,
  className,
  config,
  copyCallbacks,
  showControls,
  showCopy,
  showDownload,
  showFullscreen,
  showPanZoomControls,
}: MermaidBlockProps) => {
  const cn = useCn();

  return (
    <div
      className={cn(
        "group relative my-4 flex w-full flex-col gap-2 rounded-xl border border-border bg-sidebar p-2",
        className
      )}
      data-streamdown="mermaid-block"
    >
      <div
        className={cn("flex h-8 items-center text-muted-foreground text-xs")}
      >
        <span className={cn("ml-1 font-mono lowercase")}>mermaid</span>
      </div>
      {showControls ? (
        <div
          className={cn(
            "pointer-events-none absolute top-2 right-2 z-10 flex items-center"
          )}
        >
          <div
            className={cn(
              "pointer-events-auto flex shrink-0 items-center gap-2 rounded-md border border-sidebar bg-sidebar/80 px-1.5 py-1 supports-[backdrop-filter]:bg-sidebar/70 supports-[backdrop-filter]:backdrop-blur"
            )}
            data-streamdown="mermaid-block-actions"
          >
            {showDownload ? (
              <MermaidDownloadDropdown chart={chart} config={config} />
            ) : null}
            {showCopy ? (
              <CodeBlockCopyButton code={chart} {...copyCallbacks} />
            ) : null}
            {showFullscreen ? (
              <MermaidFullscreenButton chart={chart} config={config} />
            ) : null}
          </div>
        </div>
      ) : null}
      <div
        className={cn(
          "overflow-hidden rounded-md border border-border bg-background"
        )}
      >
        <Mermaid
          chart={chart}
          config={config}
          showControls={showPanZoomControls}
        />
      </div>
    </div>
  );
};
