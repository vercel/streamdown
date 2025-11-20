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
import {
  codeBlockClassName,
  darkModeClassNames,
  lineDiffClassNames,
  lineFocusedClassNames,
  lineHighlightClassNames,
  lineNumberClassNames,
  wordHighlightClassNames,
} from "./classnames";
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
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "Required"
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
        <div
          className={cn(
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
    </CodeBlockContext.Provider>
  );
};
