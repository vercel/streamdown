import type { JSX } from "react";
import { memo } from "react";
import type { IconMap } from "./icon-context";
import { useIcons } from "./icon-context";
import type { ExtraProps } from "./markdown";
import { useCn } from "./prefix-context";
import type { StreamdownTranslations } from "./translations-context";
import { useTranslations } from "./translations-context";

export type AdmonitionProps = JSX.IntrinsicElements["div"] &
  ExtraProps & {
    "data-admonition-type"?: string;
  };

const ADMONITION_STYLES: Record<
  string,
  { border: string; bg: string; text: string }
> = {
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

const ICON_MAP: Record<string, keyof IconMap> = {
  note: "AdmonitionNoteIcon",
  tip: "AdmonitionTipIcon",
  important: "AdmonitionImportantIcon",
  warning: "AdmonitionWarningIcon",
  caution: "AdmonitionCautionIcon",
};

const TRANSLATION_MAP: Record<string, keyof StreamdownTranslations> = {
  note: "admonitionNote",
  tip: "admonitionTip",
  important: "admonitionImportant",
  warning: "admonitionWarning",
  caution: "admonitionCaution",
};

/**
 * React's shallow prop comparison minus the fresh-on-every-parse `node` prop.
 * Position-based comparisons miss same-length content replacements, so every
 * prop that reaches the output participates.
 */
const areAdmonitionPropsEqual = (prev: object, next: object): boolean => {
  const prevKeys = Object.keys(prev);

  if (prevKeys.length !== Object.keys(next).length) {
    return false;
  }

  const prevRecord = prev as Record<string, unknown>;
  const nextRecord = next as Record<string, unknown>;

  return prevKeys.every(
    (key) => key === "node" || Object.is(prevRecord[key], nextRecord[key])
  );
};

export const MemoAdmonition = memo<AdmonitionProps>(
  ({
    children,
    className,
    node,
    "data-admonition-type": dataAttr,
    ...props
  }) => {
    const cn = useCn();
    const type = dataAttr ?? "note";
    const style = ADMONITION_STYLES[type] ?? DEFAULT_STYLE;
    const icons = useIcons();
    const translations = useTranslations();
    const IconComponent = icons[ICON_MAP[type] ?? "AdmonitionNoteIcon"];
    const titleText = translations[TRANSLATION_MAP[type] ?? "admonitionNote"];

    return (
      <div
        className={cn(
          "my-4 rounded-lg border-s-4 p-4",
          style.border,
          style.bg,
          className
        )}
        data-admonition-type={type}
        data-streamdown="admonition"
        {...props}
      >
        <div
          className={cn(
            "mb-2 flex items-center gap-2 font-semibold",
            style.text
          )}
          data-streamdown="admonition-title"
        >
          <IconComponent height={16} width={16} />
          <span>{titleText}</span>
        </div>
        <div data-streamdown="admonition-content">{children}</div>
      </div>
    );
  },
  areAdmonitionPropsEqual
);
MemoAdmonition.displayName = "MarkdownAdmonition";
