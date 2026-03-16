import type { JSX } from "react";
import { memo } from "react";
import { useCn } from "./prefix-context";

interface MarkdownNode {
  position?: {
    start?: { line?: number; column?: number };
    end?: { line?: number; column?: number };
  };
}

type AdmonitionProps = {
  children?: React.ReactNode;
  className?: string;
  node?: MarkdownNode;
  "data-admonition-type"?: string;
  dataAdmonitionType?: string;
} & JSX.IntrinsicElements["div"];

const ADMONITION_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  note: {
    border: "border-blue-500",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
  },
  tip: {
    border: "border-green-500",
    bg: "bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
  },
  important: {
    border: "border-purple-500",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
  },
  warning: {
    border: "border-yellow-500",
    bg: "bg-yellow-500/10",
    text: "text-yellow-600 dark:text-yellow-400",
  },
  caution: {
    border: "border-red-500",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
  },
};

const DEFAULT_STYLE = ADMONITION_STYLES.note;

export const MemoAdmonition = memo<AdmonitionProps>(
  ({
    children,
    className,
    node,
    "data-admonition-type": dataAttr,
    dataAdmonitionType,
    ...props
  }) => {
    const cn = useCn();
    const type = dataAttr ?? dataAdmonitionType ?? "note";
    const style = ADMONITION_STYLES[type] ?? DEFAULT_STYLE;

    return (
      <div
        className={cn(
          "my-4 rounded-lg border-l-4 p-4",
          style.border,
          style.bg,
          className
        )}
        data-admonition-type={type}
        data-streamdown="admonition"
        {...props}
      >
        <div
          className={cn("mb-2 flex items-center gap-2 font-semibold", style.text)}
          data-streamdown="admonition-title"
        >
          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
        </div>
        <div data-streamdown="admonition-content">
          {children}
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.className === next.className &&
    prev["data-admonition-type"] === next["data-admonition-type"] &&
    prev.dataAdmonitionType === next.dataAdmonitionType &&
    prev.node?.position?.start?.line === next.node?.position?.start?.line &&
    prev.node?.position?.start?.column === next.node?.position?.start?.column &&
    prev.node?.position?.end?.line === next.node?.position?.end?.line &&
    prev.node?.position?.end?.column === next.node?.position?.end?.column
);
MemoAdmonition.displayName = "MarkdownAdmonition";
