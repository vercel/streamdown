"use client";

import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { type BundledLanguage } from "shiki";
import { useShikiHighlighter } from "react-shiki";
import { ShikiThemeContext, StreamdownRuntimeContext } from "../index";
import { cn, save } from "./utils";

type CodeBlockReactShikiProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: BundledLanguage;
  delay?: number;
};

type CodeBlockContextType = {
  code: string;
};

const CodeBlockReactShikiContext = createContext<CodeBlockContextType>({
  code: "",
});

export const CodeBlockReactShiki = ({
  code,
  language,
  className,
  children,
  delay = 200,
  ...rest
}: CodeBlockReactShikiProps) => {
  const [lightTheme, darkTheme] = useContext(ShikiThemeContext);

  // Use multi-theme with single render - CSS handles theme switching
  const highlightedCode = useShikiHighlighter(
    code,
    language,
    {
      light: lightTheme,
      dark: darkTheme,
    },
    {
      defaultColor: "light",
      delay,
    }
  );

  useEffect(() => {
    console.log('[Streamdown] Using React-Shiki for code highlighting', { language });
  }, [language]);

  return (
    <CodeBlockReactShikiContext.Provider value={{ code }}>
      <div
        className="w-full overflow-hidden rounded-xl border"
        data-code-block-container
        data-language={language}
        data-highlighter="react-shiki"
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
              className={cn("overflow-x-auto [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-xs [&_pre]:p-4 [&_pre]:bg-muted/40", className)}
              data-code-block
              data-language={language}
              {...rest}
            >
              {highlightedCode}
            </div>
          </div>
        </div>
      </div>
    </CodeBlockReactShikiContext.Provider>
  );
};

export type CodeBlockReactShikiCopyButtonProps = ComponentProps<"button"> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export type CodeBlockReactShikiDownloadButtonProps =
  ComponentProps<"button"> & {
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

export const CodeBlockReactShikiDownloadButton = ({
  onDownload,
  onError,
  language,
  children,
  className,
  code: propCode,
  ...props
}: CodeBlockReactShikiDownloadButtonProps & {
  code?: string;
  language?: BundledLanguage;
}) => {
  const { code: contextCode } = useContext(CodeBlockReactShikiContext);
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

export const CodeBlockReactShikiCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  code: propCode,
  ...props
}: CodeBlockReactShikiCopyButtonProps & { code?: string }) => {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef(0);
  const { code: contextCode } = useContext(CodeBlockReactShikiContext);
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

  useEffect(() => {
    return () => {
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

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
