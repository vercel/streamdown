import { handleComparisonOperators } from "./comparison-operator-handler";
import {
  handleIncompleteBold,
  handleIncompleteBoldItalic,
  handleIncompleteDoubleUnderscoreItalic,
  handleIncompleteSingleAsteriskItalic,
  handleIncompleteSingleUnderscoreItalic,
} from "./emphasis-handlers";
import { handleIncompleteHtmlTag } from "./html-tag-handler";
import { handleIncompleteInlineCode } from "./inline-code-handler";
import {
  handleIncompleteBlockKatex,
  handleIncompleteInlineKatex,
} from "./katex-handler";
import {
  handleIncompleteLinksAndImages,
  type LinkMode,
} from "./link-image-handler";
import { handleIncompleteSetextHeading } from "./setext-heading-handler";
import { handleSingleTildeEscape } from "./single-tilde-handler";
import { handleIncompleteStrikethrough } from "./strikethrough-handler";

export type { LinkMode } from "./link-image-handler";
// biome-ignore lint/performance/noBarrelFile: "Re-exports utility functions for public API convenience"
export {
  isWithinCodeBlock,
  isWithinLinkOrImageUrl,
  isWithinMathBlock,
  isWordChar,
} from "./utils";

/**
 * Handler function that transforms text during streaming.
 */
export interface RemendHandler {
  /** Handler function: takes text, returns modified text */
  handle: (text: string) => string;
  /** Unique identifier for this handler */
  name: string;
  /** Priority (lower runs first). Built-in priorities: 0-100. Default: 100 */
  priority?: number;
}

/**
 * Configuration options for the remend function.
 * Options default to `true` unless noted otherwise.
 * Set an option to `false` to disable that specific completion.
 */
export interface RemendOptions {
  /** Complete bold formatting (e.g., `**text` → `**text**`) */
  bold?: boolean;
  /** Complete bold-italic formatting (e.g., `***text` → `***text***`) */
  boldItalic?: boolean;
  /** Escape > as comparison operators in list items (e.g., `- > 25` → `- \> 25`) */
  comparisonOperators?: boolean;
  /** Custom handlers to extend remend */
  handlers?: RemendHandler[];
  /** Strip incomplete HTML tags at end of streaming text (e.g., `text <custom` → `text`) */
  htmlTags?: boolean;
  /** Complete images (e.g., `![alt](url` → `![alt](streamdown:incomplete-image)`) */
  images?: boolean;
  /** Complete inline code formatting (e.g., `` `code `` → `` `code` ``) */
  inlineCode?: boolean;
  /**
   * Complete inline KaTeX math (e.g., `$equation` → `$equation$`).
   * Defaults to `false` — single `$` is ambiguous with currency symbols.
   */
  inlineKatex?: boolean;
  /** Complete italic formatting (e.g., `*text` → `*text*` or `_text` → `_text_`) */
  italic?: boolean;
  /** Complete block KaTeX math (e.g., `$$equation` → `$$equation$$`) */
  katex?: boolean;
  /**
   * How to handle incomplete links:
   * - `'protocol'`: Use `streamdown:incomplete-link` placeholder URL (default)
   * - `'text-only'`: Display only the link text without any link markup
   */
  linkMode?: "protocol" | "text-only";
  /** Complete links and images (e.g., `[text](url` → `[text](streamdown:incomplete-link)`) */
  links?: boolean;
  /** Handle incomplete setext headings to prevent misinterpretation */
  setextHeadings?: boolean;
  /** Escape single ~ between word characters to prevent false strikethrough (e.g., `20~25` → `20\~25`) */
  singleTilde?: boolean;
  /** Complete strikethrough formatting (e.g., `~~text` → `~~text~~`) */
  strikethrough?: boolean;
}

// Helper to check if an option is enabled (defaults to true)
const isEnabled = (option: boolean | undefined): boolean => option !== false;

// Helper to check if an opt-in option is enabled (defaults to false)
const isOptedIn = (option: boolean | undefined): boolean => option === true;

// Built-in handler priorities (0-100)
const PRIORITY = {
  SINGLE_TILDE: 0,
  COMPARISON_OPERATORS: 5,
  HTML_TAGS: 10,
  SETEXT_HEADINGS: 15,
  LINKS: 20,
  BOLD_ITALIC: 30,
  BOLD: 35,
  ITALIC_DOUBLE_UNDERSCORE: 40,
  ITALIC_SINGLE_ASTERISK: 41,
  ITALIC_SINGLE_UNDERSCORE: 42,
  INLINE_CODE: 50,
  STRIKETHROUGH: 60,
  KATEX: 70,
  INLINE_KATEX: 75,
  DEFAULT: 100,
} as const;

// Built-in handlers with their option keys and priorities
const builtInHandlers: Array<{
  handler: RemendHandler;
  optionKey: keyof Omit<RemendOptions, "handlers" | "linkMode">;
  earlyReturn?: (result: string) => boolean;
}> = [
  {
    handler: {
      name: "singleTilde",
      handle: handleSingleTildeEscape,
      priority: PRIORITY.SINGLE_TILDE,
    },
    optionKey: "singleTilde",
  },
  {
    handler: {
      name: "comparisonOperators",
      handle: handleComparisonOperators,
      priority: PRIORITY.COMPARISON_OPERATORS,
    },
    optionKey: "comparisonOperators",
  },
  {
    handler: {
      name: "htmlTags",
      handle: handleIncompleteHtmlTag,
      priority: PRIORITY.HTML_TAGS,
    },
    optionKey: "htmlTags",
  },
  {
    handler: {
      name: "setextHeadings",
      handle: handleIncompleteSetextHeading,
      priority: PRIORITY.SETEXT_HEADINGS,
    },
    optionKey: "setextHeadings",
  },
  {
    handler: {
      name: "links",
      handle: handleIncompleteLinksAndImages,
      priority: PRIORITY.LINKS,
    },
    optionKey: "links",
    earlyReturn: (result) =>
      result.endsWith("](streamdown:incomplete-link)") ||
      result.endsWith("](streamdown:incomplete-image)"),
  },
  {
    handler: {
      name: "boldItalic",
      handle: handleIncompleteBoldItalic,
      priority: PRIORITY.BOLD_ITALIC,
    },
    optionKey: "boldItalic",
  },
  {
    handler: {
      name: "bold",
      handle: handleIncompleteBold,
      priority: PRIORITY.BOLD,
    },
    optionKey: "bold",
  },
  {
    handler: {
      name: "italicDoubleUnderscore",
      handle: handleIncompleteDoubleUnderscoreItalic,
      priority: PRIORITY.ITALIC_DOUBLE_UNDERSCORE,
    },
    optionKey: "italic",
  },
  {
    handler: {
      name: "italicSingleAsterisk",
      handle: handleIncompleteSingleAsteriskItalic,
      priority: PRIORITY.ITALIC_SINGLE_ASTERISK,
    },
    optionKey: "italic",
  },
  {
    handler: {
      name: "italicSingleUnderscore",
      handle: handleIncompleteSingleUnderscoreItalic,
      priority: PRIORITY.ITALIC_SINGLE_UNDERSCORE,
    },
    optionKey: "italic",
  },
  {
    handler: {
      name: "inlineCode",
      handle: handleIncompleteInlineCode,
      priority: PRIORITY.INLINE_CODE,
    },
    optionKey: "inlineCode",
  },
  {
    handler: {
      name: "strikethrough",
      handle: handleIncompleteStrikethrough,
      priority: PRIORITY.STRIKETHROUGH,
    },
    optionKey: "strikethrough",
  },
  {
    handler: {
      name: "katex",
      handle: handleIncompleteBlockKatex,
      priority: PRIORITY.KATEX,
    },
    optionKey: "katex",
  },
  {
    handler: {
      name: "inlineKatex",
      handle: handleIncompleteInlineKatex,
      priority: PRIORITY.INLINE_KATEX,
    },
    optionKey: "inlineKatex",
  },
];

// Also enable links handler when images option is enabled
const getEnabledBuiltInHandlers = (
  options?: RemendOptions
): Array<{
  handler: RemendHandler;
  earlyReturn?: (result: string) => boolean;
}> => {
  const linkMode: LinkMode = options?.linkMode ?? "protocol";

  return builtInHandlers
    .filter(({ handler, optionKey }) => {
      // Special case: links handler is enabled by either links or images option
      if (handler.name === "links") {
        return isEnabled(options?.links) || isEnabled(options?.images);
      }
      // Special case: inlineKatex is opt-in (defaults to false, unlike other options)
      if (handler.name === "inlineKatex") {
        return isOptedIn(options?.inlineKatex);
      }
      return isEnabled(options?.[optionKey]);
    })
    .map(({ handler, earlyReturn }) => {
      // Special case: wrap links handler to pass linkMode option
      if (handler.name === "links") {
        return {
          handler: {
            ...handler,
            handle: (text: string) =>
              handleIncompleteLinksAndImages(text, linkMode),
          },
          // Only use early return for protocol mode (text-only won't end with the marker)
          earlyReturn: linkMode === "protocol" ? earlyReturn : undefined,
        };
      }
      return { handler, earlyReturn };
    });
};

// Parses markdown text and removes incomplete tokens to prevent partial rendering
const remend = (text: string, options?: RemendOptions): string => {
  if (!text || typeof text !== "string") {
    return text;
  }

  // Remove trailing whitespace if it's not a double space
  let result =
    text.endsWith(" ") && !text.endsWith("  ") ? text.slice(0, -1) : text;

  // Get enabled built-in handlers
  const enabledBuiltIns = getEnabledBuiltInHandlers(options);

  // Combine with custom handlers (default priority: 100)
  const customHandlers = (options?.handlers ?? []).map((h) => ({
    handler: { ...h, priority: h.priority ?? PRIORITY.DEFAULT },
    earlyReturn: undefined,
  }));

  // Merge and sort by priority
  // Priority is always set: built-ins have explicit priority, customs get default at line 252
  const allHandlers = [...enabledBuiltIns, ...customHandlers].sort(
    (a, b) => (a.handler.priority ?? 0) - (b.handler.priority ?? 0)
  );

  // Execute handlers in priority order
  for (const { handler, earlyReturn } of allHandlers) {
    result = handler.handle(result);

    // Check for early return condition (e.g., incomplete link marker)
    if (earlyReturn?.(result)) {
      return result;
    }
  }

  return result;
};

export default remend;
