import {
  type HTMLAttributes,
  startTransition,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { BundledLanguage } from "shiki";
import { useThrottledDebounce } from "../../hooks/use-throttled-debouce";
import { StreamdownContext } from "../../index";
import { cn } from "../utils";
import { CodeBlockContext } from "./context";
import { CodeBlockHeader } from "./header";
import { highlighterManager } from "./highlight-manager";
import {
  escapeHtml,
  getHighlightThrottling,
  splitCurrentIncompleteLineFromCode,
} from "./utils";

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: BundledLanguage;
  preClassName?: string;
};

const lineNumberClassNames = cn(
  "[&_code]:[counter-reset:line]",
  "[&_code]:[counter-increment:line_0]",
  "[&_.line]:before:content-[counter(line)]",
  "[&_.line]:before:inline-block",
  "[&_.line]:before:[counter-increment:line]",
  "[&_.line]:before:w-4",
  "[&_.line]:before:mr-4",
  "[&_.line]:before:text-[13px]",
  "[&_.line]:before:text-right",
  "[&_.line]:before:text-muted-foreground/50",
  "[&_.line]:before:font-mono",
  "[&_.line]:before:select-none"
);

const darkModeClassNames = cn(
  "dark:[&_.shiki]:!text-[var(--shiki-dark)]",
  "dark:[&_.shiki]:!bg-[var(--shiki-dark-bg)]",
  "dark:[&_.shiki]:![font-style:var(--shiki-dark-font-style)]",
  "dark:[&_.shiki]:![font-weight:var(--shiki-dark-font-weight)]",
  "dark:[&_.shiki]:![text-decoration:var(--shiki-dark-text-decoration)]",
  "dark:[&_.shiki_span]:!text-[var(--shiki-dark)]",
  "dark:[&_.shiki_span]:![font-style:var(--shiki-dark-font-style)]",
  "dark:[&_.shiki_span]:![font-weight:var(--shiki-dark-font-weight)]",
  "dark:[&_.shiki_span]:![text-decoration:var(--shiki-dark-text-decoration)]"
);

const lineHighlightClassNames = cn(
  "[&_.line.highlighted]:bg-blue-50",
  "[&_.line.highlighted]:after:bg-blue-500",
  "[&_.line.highlighted]:after:absolute",
  "[&_.line.highlighted]:after:left-0",
  "[&_.line.highlighted]:after:top-0",
  "[&_.line.highlighted]:after:bottom-0",
  "[&_.line.highlighted]:after:w-0.5",
  "dark:[&_.line.highlighted]:!bg-blue-500/10"
);

const lineDiffClassNames = cn(
  "[&_.line.diff]:after:absolute",
  "[&_.line.diff]:after:left-0",
  "[&_.line.diff]:after:top-0",
  "[&_.line.diff]:after:bottom-0",
  "[&_.line.diff]:after:w-0.5",
  "[&_.line.diff.add]:bg-emerald-50",
  "[&_.line.diff.add]:after:bg-emerald-500",
  "[&_.line.diff.remove]:bg-rose-50",
  "[&_.line.diff.remove]:after:bg-rose-500",
  "dark:[&_.line.diff.add]:!bg-emerald-500/10",
  "dark:[&_.line.diff.remove]:!bg-rose-500/10"
);

const lineFocusedClassNames = cn(
  "[&_code:has(.focused)_.line]:blur-[2px]",
  "[&_code:has(.focused)_.line.focused]:blur-none"
);

const wordHighlightClassNames = cn(
  "[&_.highlighted-word]:bg-blue-50",
  "dark:[&_.highlighted-word]:!bg-blue-500/10"
);

const codeBlockClassName = cn("[&_.shiki]:!bg-[var(--shiki-bg)]");

export const CodeBlock = ({
  code,
  language,
  className,
  children,
  preClassName,
  ...rest
}: CodeBlockProps) => {
  const { mode, shikiTheme } = useContext(StreamdownContext);
  const [html, setHtml] = useState<string>("");
  const [lastHighlightedCode, setLastHighlightedCode] = useState("");
  const [incompleteLine, setIncompleteLine] = useState("");
  const codeToHighlight = useThrottledDebounce(code);
  const timeoutRef = useRef(0);
  const mounted = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastHighlightTime = useRef(0);
  const [lightTheme, darkTheme] = shikiTheme;

  useEffect(() => {
    highlighterManager.initializeHighlighters([lightTheme, darkTheme]);
  }, [lightTheme, darkTheme]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: "adding lastHighlightedCode to dependency array will trigger re-runs"
  useEffect(() => {
    mounted.current = true;

    // Cancel previous highlight operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Static mode: simple, immediate highlighting without streaming optimizations
    if (mode === "static") {
      if (codeToHighlight && codeToHighlight !== lastHighlightedCode) {
        highlighterManager
          .highlightCode(codeToHighlight, language, preClassName, signal)
          .then((highlightedHtml) => {
            if (mounted.current && !signal.aborted) {
              setHtml(highlightedHtml);
              setLastHighlightedCode(codeToHighlight);
              setIncompleteLine("");
            }
          })
          .catch((err) => {
            // Silently ignore AbortError
            if (err.name !== "AbortError") {
              throw err;
            }
          });
      }
      return () => {
        mounted.current = false;
        abortControllerRef.current?.abort();
      };
    }

    // Streaming mode: complex highlighting with incremental updates and throttling
    const [completeCode, currentIncompleteLine] =
      splitCurrentIncompleteLineFromCode(codeToHighlight);

    // Adaptive throttling based on code size
    const lineCount = codeToHighlight.split("\n").length;

    const { minHighlightInterval, debounceMs } =
      getHighlightThrottling(lineCount);

    if (completeCode && completeCode !== lastHighlightedCode) {
      const now = Date.now();
      const timeSinceLastHighlight = now - lastHighlightTime.current;

      // Throttle: only highlight if enough time has passed OR streaming has stopped
      if (
        timeSinceLastHighlight > minHighlightInterval ||
        !currentIncompleteLine
      ) {
        lastHighlightTime.current = now;
        highlighterManager
          .highlightCode(completeCode, language, preClassName, signal)
          .then((highlightedHtml) => {
            if (mounted.current && !signal.aborted) {
              // Use startTransition to mark these updates as non-urgent
              startTransition(() => {
                setHtml(highlightedHtml);
                setLastHighlightedCode(completeCode);
                setIncompleteLine(currentIncompleteLine);
              });
            }
          })
          .catch((err) => {
            // Silently ignore AbortError
            if (err.name !== "AbortError") {
              throw err;
            }
          });
      } else {
        // Skip this highlight, let debounce handle it
        setIncompleteLine(currentIncompleteLine);
      }
    } else {
      // set incomplete line immediately here for incremental streaming updates
      setIncompleteLine(currentIncompleteLine);
    }

    // Debounce full highlight (e.g. in case streaming stops)
    timeoutRef.current = window.setTimeout(() => {
      if (
        currentIncompleteLine &&
        codeToHighlight !== lastHighlightedCode &&
        !signal.aborted
      ) {
        highlighterManager
          .highlightCode(codeToHighlight, language, preClassName, signal)
          .then((highlightedHtml) => {
            if (mounted.current && !signal.aborted) {
              // Use startTransition to mark these updates as non-urgent
              startTransition(() => {
                setHtml(highlightedHtml);
                setLastHighlightedCode(codeToHighlight);
                setIncompleteLine("");
              });
            }
          })
          .catch((err) => {
            // Silently ignore AbortError
            if (err.name !== "AbortError") {
              throw err;
            }
          });
      }
    }, debounceMs);
    return () => {
      mounted.current = false;
      abortControllerRef.current?.abort();
    };
  }, [codeToHighlight, language, preClassName, mode]);

  const incompleteLineHtml = incompleteLine
    ? `<span class="line"><span>${escapeHtml(incompleteLine)}</span></span>`
    : "";

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className="my-4 w-full overflow-hidden rounded-xl border border-border"
        data-code-block-container
        data-language={language}
      >
        <CodeBlockHeader language={language}>{children}</CodeBlockHeader>
        <div className="w-full">
          <div className="min-w-full">
            <div
              className={cn(
                "overflow-x-auto",
                lineNumberClassNames,
                codeBlockClassName,
                darkModeClassNames,
                lineHighlightClassNames,
                lineDiffClassNames,
                lineFocusedClassNames,
                wordHighlightClassNames,
                className
              )}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
              dangerouslySetInnerHTML={{
                __html: incompleteLineHtml ? html + incompleteLineHtml : html,
              }}
              data-code-block
              data-language={language}
              {...rest}
            />
          </div>
        </div>
      </div>
    </CodeBlockContext.Provider>
  );
};
