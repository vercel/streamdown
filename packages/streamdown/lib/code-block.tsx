"use client";

import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  startTransition,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type BundledLanguage,
  type BundledTheme,
  bundledLanguages,
  createHighlighter,
  type ShikiTransformer,
  type SpecialLanguage,
} from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { ShikiThemeContext, StreamdownRuntimeContext } from "../index";
import { cn, save } from "./utils";

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: BundledLanguage;
  preClassName?: string;
};

type CodeBlockContextType = {
  code: string;
};

type HighlightThrottling = {
  minHighlightInterval: number;
  debounceMs: number;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

function useThrottledDebounce<T>(value: T, throttleMs = 200, debounceMs = 50) {
  const [processedValue, setProcessedValue] = useState(value);
  const lastRunTime = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRunTime.current;

    // Clear any pending debounce
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    // If enough time has passed, run immediately (throttle)
    if (timeSinceLastRun >= throttleMs) {
      setProcessedValue(value);
      lastRunTime.current = now;
    } else {
      // Otherwise, debounce it
      timeoutRef.current = window.setTimeout(() => {
        setProcessedValue(value);
        lastRunTime.current = Date.now();
      }, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [value, throttleMs, debounceMs]);

  return processedValue;
}

const getHighlightThrottling = (lineCount: number): HighlightThrottling => {
  const smallThreshold = 50;
  const mediumThreshold = 150;
  const largeThreshold = 300;
  if (lineCount < smallThreshold) {
    // Small blocks: highlight frequently
    return {
      minHighlightInterval: 100,
      debounceMs: 500,
    };
  }
  if (lineCount < mediumThreshold) {
    // Medium blocks: reduce highlight frequency
    return {
      minHighlightInterval: 500,
      debounceMs: 800,
    };
  }
  if (lineCount < largeThreshold) {
    // Large blocks: highlight rarely, rely on debounce
    return {
      minHighlightInterval: 1500,
      debounceMs: 1200,
    };
  }
  // Very large blocks: skip immediate highlights entirely during streaming
  return {
    minHighlightInterval: Number.POSITIVE_INFINITY,
    debounceMs: 1500,
  };
};

const escapeHtml = (html: string) =>
  html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const splitCurrentIncompleteLineFromCode = (code: string): [string, string] => {
  const lastNewLineIndex = code.lastIndexOf("\n");
  const completeCode =
    lastNewLineIndex >= 0 ? code.slice(0, lastNewLineIndex + 1) : "";
  const currentIncompleteLine =
    lastNewLineIndex >= 0 ? code.slice(lastNewLineIndex + 1) : code;
  return [completeCode, currentIncompleteLine];
};

// Added separate from HighlighterManager class to avoid conflicts with `this`
const getTransformersFromPreClassName = (
  preClassName?: string
): ShikiTransformer[] => {
  if (!preClassName) {
    return [];
  }
  const preTransformer: ShikiTransformer = {
    pre(node) {
      this.addClassToHast(node, preClassName);
      return node;
    },
  };
  return [preTransformer];
};

class HighlighterManager {
  private lightHighlighter: Awaited<
    ReturnType<typeof createHighlighter>
  > | null = null;
  private darkHighlighter: Awaited<
    ReturnType<typeof createHighlighter>
  > | null = null;
  private lightTheme: BundledTheme | null = null;
  private darkTheme: BundledTheme | null = null;
  private readonly loadedLanguages: Set<BundledLanguage> = new Set();
  private initializationPromise: Promise<void> | null = null;
  private loadLanguagePromise: Promise<void> | null = null;

  // LRU cache for highlighted code
  private readonly cache = new Map<string, [string, string]>();
  private cacheKeys: string[] = [];
  private readonly MAX_CACHE_SIZE = 50;

  // Queue to deduplicate concurrent highlight requests
  private readonly highlightQueue = new Map<
    string,
    Promise<[string, string]>
  >();

  private isLanguageSupported(language: string): language is BundledLanguage {
    return Object.hasOwn(bundledLanguages, language);
  }

  private getFallbackLanguage(): SpecialLanguage {
    return "text";
  }

  private getCacheKey(
    code: string,
    language: string,
    preClassName?: string
  ): string {
    return `${language}::${preClassName || ""}::${code}`;
  }

  private addToCache(key: string, value: [string, string]): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cacheKeys.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
    this.cacheKeys.push(key);
  }

  private needsHighlightersInitialization(
    themes: [BundledTheme, BundledTheme]
  ): [boolean, boolean] {
    const [lightTheme, darkTheme] = themes;
    // Check if we need to recreate highlighters due to theme change
    const needsLightRecreation =
      !this.lightHighlighter || this.lightTheme !== lightTheme;
    const needsDarkRecreation =
      !this.darkHighlighter || this.darkTheme !== darkTheme;
    return [needsLightRecreation, needsDarkRecreation];
  }

  private async ensureHighlightersInitialized(
    themes: [BundledTheme, BundledTheme],
    needsThemeRecreation: [boolean, boolean]
  ): Promise<void> {
    const [needsLightRecreation, needsDarkRecreation] = needsThemeRecreation;
    const [lightTheme, darkTheme] = themes;
    const jsEngine = createJavaScriptRegexEngine({ forgiving: true });

    // If themes changed, reset loaded languages, clear cache, and clear queue
    this.loadedLanguages.clear();
    this.cache.clear();
    this.cacheKeys = [];
    this.highlightQueue.clear();

    // Create or recreate light highlighter if needed
    if (needsLightRecreation) {
      this.lightHighlighter = await createHighlighter({
        themes: [lightTheme],
        langs: [],
        engine: jsEngine,
      });
      this.lightTheme = lightTheme;
    }

    // Create or recreate dark highlighter if needed
    if (needsDarkRecreation) {
      this.darkHighlighter = await createHighlighter({
        themes: [darkTheme],
        langs: [],
        engine: jsEngine,
      });
      this.darkTheme = darkTheme;
    }
  }

  private async loadLanguage(language: BundledLanguage): Promise<void> {
    // Load the language
    await this.darkHighlighter?.loadLanguage(language);
    await this.lightHighlighter?.loadLanguage(language);
    this.loadedLanguages.add(language);
  }

  async initializeHighlighters(
    themes: [BundledTheme, BundledTheme]
  ): Promise<void> {
    // Ensure only one initialization happens at a time
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    const needsThemeRecreation = this.needsHighlightersInitialization(themes);
    const [needsLightRecreation, needsDarkRecreation] = needsThemeRecreation;

    if (needsLightRecreation || needsDarkRecreation) {
      // Initialize or load language
      this.initializationPromise = this.ensureHighlightersInitialized(
        themes,
        needsThemeRecreation
      );
      await this.initializationPromise;
      this.initializationPromise = null;
    }
  }

  private performHighlights(
    code: string,
    language: BundledLanguage,
    preClassName?: string
  ): [string, string] {
    const lang = this.isLanguageSupported(language)
      ? language
      : this.getFallbackLanguage();

    if (
      this.lightHighlighter === null ||
      this.darkHighlighter === null ||
      this.lightTheme === null ||
      this.darkTheme === null
    ) {
      throw new Error(
        "highlightCode must be called after initializeHighlighters."
      );
    }

    const transformers = getTransformersFromPreClassName(preClassName);

    // Do expensive synchronous work (still blocks, but after yielding)
    const light = this.lightHighlighter.codeToHtml(code, {
      lang,
      theme: this.lightTheme,
      transformers,
    });

    const dark = this.darkHighlighter.codeToHtml(code, {
      lang,
      theme: this.darkTheme,
      transformers,
    });
    return [light, dark];
  }

  // biome-ignore lint/suspicious/useAwait: "async is simpler than wrapping the cache return in a promise"
  async highlightCode(
    code: string,
    language: BundledLanguage,
    preClassName?: string,
    signal?: AbortSignal
  ): Promise<[string, string]> {
    // Check cache first
    const cacheKey = this.getCacheKey(code, language, preClassName);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      // Move to end (LRU)
      this.cacheKeys = this.cacheKeys.filter((k) => k !== cacheKey);
      this.cacheKeys.push(cacheKey);
      return cached;
    }

    // Check if already highlighting this exact code (deduplicate concurrent requests)
    const existing = this.highlightQueue.get(cacheKey);
    if (existing) {
      return existing;
    }

    const checkSignal = () => {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
    };

    // Create promise for this highlight operation
    const highlightPromise = (async () => {
      try {
        // Yield to browser before expensive work
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Check if aborted after yielding
        checkSignal();

        // Wait for initialization to complete before proceeding
        if (this.initializationPromise) {
          await this.initializationPromise;
        }

        // Check again after await
        checkSignal();

        // Ensure only one language load happens at a time
        if (this.loadLanguagePromise) {
          await this.loadLanguagePromise;
        }

        // Check again after await
        checkSignal();

        const needsLanguageLoad =
          !this.loadedLanguages.has(language) &&
          this.isLanguageSupported(language);

        if (needsLanguageLoad) {
          this.loadLanguagePromise = this.loadLanguage(language);
          await this.loadLanguagePromise;
          this.loadLanguagePromise = null;
        }

        // Check again after await
        checkSignal();

        const result = this.performHighlights(code, language, preClassName);
        this.addToCache(cacheKey, result);
        return result;
      } finally {
        // Clean up queue entry
        this.highlightQueue.delete(cacheKey);
      }
    })();

    // Store in queue to deduplicate concurrent requests
    this.highlightQueue.set(cacheKey, highlightPromise);
    return highlightPromise;
  }
}

// Create a singleton instance of the highlighter manager
const highlighterManager = new HighlighterManager();

export const CodeBlock = ({
  code,
  language,
  className,
  children,
  preClassName,
  ...rest
}: CodeBlockProps) => {
  const [html, setHtml] = useState<string>("");
  const [darkHtml, setDarkHtml] = useState<string>("");
  const [lastHighlightedCode, setLastHighlightedCode] = useState("");
  const [incompleteLine, setIncompleteLine] = useState("");
  const codeToHighlight = useThrottledDebounce(code);
  const timeoutRef = useRef(0);
  const mounted = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastHighlightTime = useRef(0);
  const [lightTheme, darkTheme] = useContext(ShikiThemeContext);

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
          .then(([light, dark]) => {
            if (mounted.current && !signal.aborted) {
              // Use startTransition to mark these updates as non-urgent
              startTransition(() => {
                setHtml(light);
                setDarkHtml(dark);
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
          .then(([light, dark]) => {
            if (mounted.current && !signal.aborted) {
              // Use startTransition to mark these updates as non-urgent
              startTransition(() => {
                setHtml(light);
                setDarkHtml(dark);
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
  }, [codeToHighlight, language, preClassName]);

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
        <div
          className="flex items-center justify-between bg-muted/80 p-3 text-muted-foreground text-xs"
          data-code-block-header
          data-language={language}
        >
          <span className="ml-1 font-mono lowercase">{language}</span>
          <div className="flex items-center gap-2">{children}</div>
        </div>
        <div className="w-full">
          <div className="min-w-full">
            <div
              className={cn("overflow-x-auto dark:hidden", className)}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
              dangerouslySetInnerHTML={{
                __html: incompleteLineHtml ? html + incompleteLineHtml : html,
              }}
              data-code-block
              data-language={language}
              {...rest}
            />
            <div
              className={cn("hidden overflow-x-auto dark:block", className)}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
              dangerouslySetInnerHTML={{
                __html: incompleteLineHtml
                  ? darkHtml + incompleteLineHtml
                  : darkHtml,
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

export type CodeBlockCopyButtonProps = ComponentProps<"button"> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export type CodeBlockDownloadButtonProps = ComponentProps<"button"> & {
  onDownload?: () => void;
  onError?: (error: Error) => void;
};

const languageExtensionMap: Record<BundledLanguage, string> = {
  "1c": "1c",
  "1c-query": "1cq",
  abap: "abap",
  "actionscript-3": "as",
  ada: "ada",
  adoc: "adoc",
  "angular-html": "html",
  "angular-ts": "ts",
  apache: "conf",
  apex: "cls",
  apl: "apl",
  applescript: "applescript",
  ara: "ara",
  asciidoc: "adoc",
  asm: "asm",
  astro: "astro",
  awk: "awk",
  ballerina: "bal",
  bash: "sh",
  bat: "bat",
  batch: "bat",
  be: "be",
  beancount: "beancount",
  berry: "berry",
  bibtex: "bib",
  bicep: "bicep",
  blade: "blade.php",
  bsl: "bsl",
  c: "c",
  "c#": "cs",
  "c++": "cpp",
  cadence: "cdc",
  cairo: "cairo",
  cdc: "cdc",
  clarity: "clar",
  clj: "clj",
  clojure: "clj",
  "closure-templates": "soy",
  cmake: "cmake",
  cmd: "cmd",
  cobol: "cob",
  codeowners: "CODEOWNERS",
  codeql: "ql",
  coffee: "coffee",
  coffeescript: "coffee",
  "common-lisp": "lisp",
  console: "sh",
  coq: "v",
  cpp: "cpp",
  cql: "cql",
  crystal: "cr",
  cs: "cs",
  csharp: "cs",
  css: "css",
  csv: "csv",
  cue: "cue",
  cypher: "cql",
  d: "d",
  dart: "dart",
  dax: "dax",
  desktop: "desktop",
  diff: "diff",
  docker: "dockerfile",
  dockerfile: "dockerfile",
  dotenv: "env",
  "dream-maker": "dm",
  edge: "edge",
  elisp: "el",
  elixir: "ex",
  elm: "elm",
  "emacs-lisp": "el",
  erb: "erb",
  erl: "erl",
  erlang: "erl",
  f: "f",
  "f#": "fs",
  f03: "f03",
  f08: "f08",
  f18: "f18",
  f77: "f77",
  f90: "f90",
  f95: "f95",
  fennel: "fnl",
  fish: "fish",
  fluent: "ftl",
  for: "for",
  "fortran-fixed-form": "f",
  "fortran-free-form": "f90",
  fs: "fs",
  fsharp: "fs",
  fsl: "fsl",
  ftl: "ftl",
  gdresource: "tres",
  gdscript: "gd",
  gdshader: "gdshader",
  genie: "gs",
  gherkin: "feature",
  "git-commit": "gitcommit",
  "git-rebase": "gitrebase",
  gjs: "js",
  gleam: "gleam",
  "glimmer-js": "js",
  "glimmer-ts": "ts",
  glsl: "glsl",
  gnuplot: "plt",
  go: "go",
  gql: "gql",
  graphql: "graphql",
  groovy: "groovy",
  gts: "gts",
  hack: "hack",
  haml: "haml",
  handlebars: "hbs",
  haskell: "hs",
  haxe: "hx",
  hbs: "hbs",
  hcl: "hcl",
  hjson: "hjson",
  hlsl: "hlsl",
  hs: "hs",
  html: "html",
  "html-derivative": "html",
  http: "http",
  hxml: "hxml",
  hy: "hy",
  imba: "imba",
  ini: "ini",
  jade: "jade",
  java: "java",
  javascript: "js",
  jinja: "jinja",
  jison: "jison",
  jl: "jl",
  js: "js",
  json: "json",
  json5: "json5",
  jsonc: "jsonc",
  jsonl: "jsonl",
  jsonnet: "jsonnet",
  jssm: "jssm",
  jsx: "jsx",
  julia: "jl",
  kotlin: "kt",
  kql: "kql",
  kt: "kt",
  kts: "kts",
  kusto: "kql",
  latex: "tex",
  lean: "lean",
  lean4: "lean",
  less: "less",
  liquid: "liquid",
  lisp: "lisp",
  lit: "lit",
  llvm: "ll",
  log: "log",
  logo: "logo",
  lua: "lua",
  luau: "luau",
  make: "mak",
  makefile: "mak",
  markdown: "md",
  marko: "marko",
  matlab: "m",
  md: "md",
  mdc: "mdc",
  mdx: "mdx",
  mediawiki: "wiki",
  mermaid: "mmd",
  mips: "s",
  mipsasm: "s",
  mmd: "mmd",
  mojo: "mojo",
  move: "move",
  nar: "nar",
  narrat: "narrat",
  nextflow: "nf",
  nf: "nf",
  nginx: "conf",
  nim: "nim",
  nix: "nix",
  nu: "nu",
  nushell: "nu",
  objc: "m",
  "objective-c": "m",
  "objective-cpp": "mm",
  ocaml: "ml",
  pascal: "pas",
  perl: "pl",
  perl6: "p6",
  php: "php",
  plsql: "pls",
  po: "po",
  polar: "polar",
  postcss: "pcss",
  pot: "pot",
  potx: "potx",
  powerquery: "pq",
  powershell: "ps1",
  prisma: "prisma",
  prolog: "pl",
  properties: "properties",
  proto: "proto",
  protobuf: "proto",
  ps: "ps",
  ps1: "ps1",
  pug: "pug",
  puppet: "pp",
  purescript: "purs",
  py: "py",
  python: "py",
  ql: "ql",
  qml: "qml",
  qmldir: "qmldir",
  qss: "qss",
  r: "r",
  racket: "rkt",
  raku: "raku",
  razor: "cshtml",
  rb: "rb",
  reg: "reg",
  regex: "regex",
  regexp: "regexp",
  rel: "rel",
  riscv: "s",
  rs: "rs",
  rst: "rst",
  ruby: "rb",
  rust: "rs",
  sas: "sas",
  sass: "sass",
  scala: "scala",
  scheme: "scm",
  scss: "scss",
  sdbl: "sdbl",
  sh: "sh",
  shader: "shader",
  shaderlab: "shader",
  shell: "sh",
  shellscript: "sh",
  shellsession: "sh",
  smalltalk: "st",
  solidity: "sol",
  soy: "soy",
  sparql: "rq",
  spl: "spl",
  splunk: "spl",
  sql: "sql",
  "ssh-config": "config",
  stata: "do",
  styl: "styl",
  stylus: "styl",
  svelte: "svelte",
  swift: "swift",
  "system-verilog": "sv",
  systemd: "service",
  talon: "talon",
  talonscript: "talon",
  tasl: "tasl",
  tcl: "tcl",
  templ: "templ",
  terraform: "tf",
  tex: "tex",
  tf: "tf",
  tfvars: "tfvars",
  toml: "toml",
  ts: "ts",
  "ts-tags": "ts",
  tsp: "tsp",
  tsv: "tsv",
  tsx: "tsx",
  turtle: "ttl",
  twig: "twig",
  typ: "typ",
  typescript: "ts",
  typespec: "tsp",
  typst: "typ",
  v: "v",
  vala: "vala",
  vb: "vb",
  verilog: "v",
  vhdl: "vhdl",
  vim: "vim",
  viml: "vim",
  vimscript: "vim",
  vue: "vue",
  "vue-html": "html",
  "vue-vine": "vine",
  vy: "vy",
  vyper: "vy",
  wasm: "wasm",
  wenyan: "wy",
  wgsl: "wgsl",
  wiki: "wiki",
  wikitext: "wiki",
  wit: "wit",
  wl: "wl",
  wolfram: "wl",
  xml: "xml",
  xsl: "xsl",
  yaml: "yaml",
  yml: "yml",
  zenscript: "zs",
  zig: "zig",
  zsh: "zsh",
  文言: "wy",
};

export const CodeBlockDownloadButton = ({
  onDownload,
  onError,
  language,
  children,
  className,
  code: propCode,
  ...props
}: CodeBlockDownloadButtonProps & {
  code?: string;
  language?: BundledLanguage;
}) => {
  const { code: contextCode } = useContext(CodeBlockContext);
  const { isAnimating } = useContext(StreamdownRuntimeContext);
  const code = propCode ?? contextCode;
  const extension =
    language && language in languageExtensionMap
      ? languageExtensionMap[language]
      : "txt";
  const filename = `file.${extension}`;
  const mimeType = "text/plain";

  const downloadCode = () => {
    try {
      save(filename, code, mimeType);
      onDownload?.();
    } catch (error) {
      onError?.(error as Error);
    }
  };

  return (
    <button
      className={cn(
        "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      disabled={isAnimating}
      onClick={downloadCode}
      title="Download file"
      type="button"
      {...props}
    >
      {children ?? <DownloadIcon size={14} />}
    </button>
  );
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  code: propCode,
  ...props
}: CodeBlockCopyButtonProps & { code?: string }) => {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef(0);
  const { code: contextCode } = useContext(CodeBlockContext);
  const { isAnimating } = useContext(StreamdownRuntimeContext);
  const code = propCode ?? contextCode;

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      if (!isCopied) {
        await navigator.clipboard.writeText(code);
        setIsCopied(true);
        onCopy?.();
        timeoutRef.current = window.setTimeout(
          () => setIsCopied(false),
          timeout
        );
      }
    } catch (error) {
      onError?.(error as Error);
    }
  };

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    []
  );

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <button
      className={cn(
        "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      disabled={isAnimating}
      onClick={copyToClipboard}
      type="button"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </button>
  );
};
