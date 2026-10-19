import type { CSSProperties } from "react";
import { useCn } from "./prefix-context";

/**
 * Monospace stack chosen for uniform, box-drawing-safe character advances.
 * Standard web monospace fonts frequently give `┌─┐│└┘` characters a
 * different advance width than plain ASCII, which breaks column alignment in
 * ASCII / box-drawing diagrams.
 */
const RAW_FONT_FAMILY =
  'ui-monospace, "SF Mono", "Cascadia Mono", "DejaVu Sans Mono", "Liberation Mono", Menlo, Consolas, monospace';

const RAW_STYLE: CSSProperties = {
  fontFamily: RAW_FONT_FAMILY,
  fontFeatureSettings: '"liga" 0, "calt" 0',
  fontVariantLigatures: "none",
  overflowX: "auto",
  tabSize: 2,
  whiteSpace: "pre",
};

export interface RawCodeBlockProps {
  code: string;
  isIncomplete: boolean;
  language: string;
}

/**
 * Renders a fenced code block verbatim, without syntax highlighting, line
 * numbers or controls. Used for languages listed in `codeBlockRawLanguages`
 * (e.g. ASCII / Unicode box-drawing diagrams).
 */
export const RawCodeBlock = ({
  code,
  isIncomplete,
  language,
}: RawCodeBlockProps) => {
  const cn = useCn();
  return (
    <pre
      className={cn(
        "my-4 overflow-x-auto rounded-xl border bg-sidebar p-4 text-sm"
      )}
      data-incomplete={isIncomplete}
      data-language={language}
      data-streamdown="raw-code-block"
      style={RAW_STYLE}
    >
      {code}
    </pre>
  );
};
