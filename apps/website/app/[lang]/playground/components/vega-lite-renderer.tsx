"use client";

import { useEffect, useRef } from "react";
import type { CustomRendererProps } from "streamdown";
import { CodeBlockContainer, CodeBlockHeader } from "streamdown";

export const VegaLiteRenderer = ({
  code,
  language,
  isIncomplete,
}: CustomRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isIncomplete || !containerRef.current) {
      return;
    }

    let cancelled = false;

    const render = async () => {
      try {
        const spec = JSON.parse(code);
        const vegaEmbed = (await import("vega-embed")).default;

        if (cancelled || !containerRef.current) {
          return;
        }

        containerRef.current.innerHTML = "";
        await vegaEmbed(containerRef.current, spec, {
          actions: false,
          renderer: "svg",
          theme: "vox",
        });
      } catch {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML =
            '<p class="text-sm text-destructive p-4">Invalid Vega-Lite spec</p>';
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [code, isIncomplete]);

  return (
    <CodeBlockContainer isIncomplete={isIncomplete} language={language}>
      <CodeBlockHeader language={language} />
      {isIncomplete ? (
        <div className="flex h-48 items-center justify-center rounded-md bg-muted">
          <span className="text-muted-foreground text-sm">
            Loading chart...
          </span>
        </div>
      ) : (
        <div
          className="flex items-center justify-center overflow-hidden rounded-md bg-white p-4 [&_.vega-embed]:w-full [&_svg]:max-w-full"
          ref={containerRef}
        />
      )}
    </CodeBlockContainer>
  );
};
