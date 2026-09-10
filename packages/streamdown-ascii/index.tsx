"use client";

import type { ComponentType, CSSProperties } from "react";

/**
 * Monospace stack chosen for uniform, box-drawing-safe character advances.
 * Standard web monospace fonts (e.g. the system default) frequently give
 * `┌─┐│└┘` characters a different advance width than plain ASCII, which
 * breaks column alignment in agent-generated diagrams.
 */
const DEFAULT_FONT_FAMILY =
  'ui-monospace, "SF Mono", "Cascadia Mono", "DejaVu Sans Mono", "Liberation Mono", Menlo, Consolas, monospace';

/**
 * Code fence languages bound to the ASCII renderer by default.
 */
const DEFAULT_LANGUAGES = ["ascii", "diagram", "chart"];

/**
 * Props passed to the ASCII renderer component.
 */
export interface AsciiRendererProps {
  /**
   * The raw text content inside the code fence
   */
  code: string;
  /**
   * `true` while the code fence is still being streamed
   */
  isIncomplete: boolean;
  /**
   * The language identifier from the code fence
   */
  language: string;
  /**
   * Raw metastring from the code fence, if present
   */
  meta?: string;
}

/**
 * Options for creating an ASCII plugin
 */
export interface AsciiPluginOptions {
  /**
   * Extra class names applied to the rendered `<pre>` element
   */
  className?: string;
  /**
   * Override the monospace font stack used for the rendered block
   * @default 'ui-monospace, "SF Mono", "Cascadia Mono", "DejaVu Sans Mono", "Liberation Mono", Menlo, Consolas, monospace'
   */
  fontFamily?: string;
  /**
   * Code fence languages bound to this renderer
   * @default ["ascii", "diagram", "chart"]
   */
  languages?: string[];
}

/**
 * Plugin for rendering ASCII / Unicode box-drawing diagrams.
 *
 * Structurally compatible with Streamdown's `CustomRenderer` type, so it can
 * be passed directly into `plugins.renderers` without a core dependency on
 * this package.
 */
export interface AsciiPlugin {
  /**
   * The React component that renders matching code fences
   */
  component: ComponentType<AsciiRendererProps>;
  /**
   * Code fence languages bound to this renderer
   */
  language: string[];
}

const createAsciiRenderer = (
  fontFamily: string,
  className?: string
): ComponentType<AsciiRendererProps> => {
  const AsciiRenderer = ({
    code,
    isIncomplete,
    language,
  }: AsciiRendererProps) => {
    const style: CSSProperties = {
      fontFamily,
      fontFeatureSettings: '"liga" 0, "calt" 0',
      fontVariantLigatures: "none",
      overflowX: "auto",
      tabSize: 2,
      whiteSpace: "pre",
    };

    return (
      <pre
        className={className}
        data-incomplete={isIncomplete}
        data-language={language}
        data-streamdown="ascii-block"
        style={style}
      >
        {code}
      </pre>
    );
  };

  AsciiRenderer.displayName = "AsciiRenderer";

  return AsciiRenderer;
};

/**
 * Create an ASCII plugin with optional configuration
 */
export function createAsciiPlugin(
  options: AsciiPluginOptions = {}
): AsciiPlugin {
  const fontFamily = options.fontFamily ?? DEFAULT_FONT_FAMILY;
  const languages = options.languages ?? DEFAULT_LANGUAGES;

  return {
    component: createAsciiRenderer(fontFamily, options.className),
    language: languages,
  };
}

/**
 * Pre-configured ASCII plugin with default settings
 */
export const ascii = createAsciiPlugin();
