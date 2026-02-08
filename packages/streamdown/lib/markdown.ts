import type { Element, Nodes, Parents, Root } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { urlAttributes } from "html-url-attributes";
import type { ComponentType, JSX, ReactElement } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import rehypeRaw from "rehype-raw";
import remarkParse from "remark-parse";
import type { Options as RemarkRehypeOptions } from "remark-rehype";
import remarkRehype from "remark-rehype";
import type { PluggableList } from "unified";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { remarkEscapeHtml } from "./remark/escape-html";

export interface ExtraProps {
  node?: Element | undefined;
}

export type AllowElement = (
  element: Readonly<Element>,
  index: number,
  parent: Readonly<Parents> | undefined
) => boolean | null | undefined;

export type UrlTransform = (
  url: string,
  key: string,
  node: Readonly<Element>
) => string | null | undefined;

export type Components = {
  [Key in keyof JSX.IntrinsicElements]?:
    | ComponentType<JSX.IntrinsicElements[Key] & ExtraProps>
    | keyof JSX.IntrinsicElements;
} & {
  [key: string]:
    | ComponentType<Record<string, unknown> & ExtraProps>
    | keyof JSX.IntrinsicElements
    | undefined;
};

export interface Options {
  allowElement?: AllowElement;
  allowedElements?: ReadonlyArray<string>;
  children?: string;
  components?: Components;
  disallowedElements?: ReadonlyArray<string>;
  rehypePlugins?: PluggableList;
  remarkPlugins?: PluggableList;
  remarkRehypeOptions?: Readonly<RemarkRehypeOptions>;
  skipHtml?: boolean;
  unwrapDisallowed?: boolean;
  urlTransform?: UrlTransform;
}

// Stable references for common cases
const EMPTY_PLUGINS: PluggableList = [];
const DEFAULT_REMARK_REHYPE_OPTIONS = { allowDangerousHtml: true };

// Plugin name cache for faster serialization
// biome-ignore lint/complexity/noBannedTypes: "Need Function type for plugin caching"
const pluginNameCache = new WeakMap<Function, string>();

// LRU Cache for unified processors
class ProcessorCache {
  // biome-ignore lint/suspicious/noExplicitAny: Processor type is complex and varies with plugins
  private readonly cache = new Map<string, any>();
  private readonly keyCache = new WeakMap<Readonly<Options>, string>();
  private readonly maxSize = 100;

  generateCacheKey(options: Readonly<Options>): string {
    // Check WeakMap cache first for faster lookups (before any processing)
    const cachedKey = this.keyCache.get(options);
    if (cachedKey) {
      return cachedKey;
    }

    const rehypePlugins = options.rehypePlugins;
    const remarkPlugins = options.remarkPlugins;
    const remarkRehypeOptions = options.remarkRehypeOptions;

    // Fast path for no plugins (most common case)
    if (!(rehypePlugins || remarkPlugins || remarkRehypeOptions)) {
      const key = "default";
      this.keyCache.set(options, key);
      return key;
    }

    // Optimize serialization for plugins
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "Plugin serialization requires checking multiple plugin formats"
    const serializePlugins = (plugins: PluggableList | undefined): string => {
      if (!plugins || plugins.length === 0) {
        return "";
      }

      let result = "";
      for (let i = 0; i < plugins.length; i += 1) {
        const plugin = plugins[i];
        if (i > 0) {
          result += ",";
        }

        if (Array.isArray(plugin)) {
          // Plugin with options: [plugin, options]
          const [pluginFn, pluginOptions] = plugin;
          if (typeof pluginFn === "function") {
            let name = pluginNameCache.get(pluginFn);
            if (!name) {
              name = pluginFn.name;
              pluginNameCache.set(pluginFn, name);
            }
            result += name;
          } else {
            result += String(pluginFn);
          }
          result += ":";
          result += JSON.stringify(pluginOptions);
        } else if (typeof plugin === "function") {
          // Plugin without options
          let name = pluginNameCache.get(plugin);
          if (!name) {
            name = plugin.name;
            pluginNameCache.set(plugin, name);
          }
          result += name;
        } else {
          result += String(plugin);
        }
      }
      return result;
    };

    const rehypeKey = serializePlugins(rehypePlugins);
    const remarkKey = serializePlugins(remarkPlugins);
    const optionsKey = remarkRehypeOptions
      ? JSON.stringify(remarkRehypeOptions)
      : "";

    const key = `${remarkKey}::${rehypeKey}::${optionsKey}`;

    // Cache the key in WeakMap for this options object
    this.keyCache.set(options, key);

    return key;
  }

  get(options: Readonly<Options>) {
    const key = this.generateCacheKey(options);
    const processor = this.cache.get(key);

    if (processor) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, processor);
    }

    return processor;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Processor type is complex and varies with plugins
  set(options: Readonly<Options>, processor: any): void {
    const key = this.generateCacheKey(options);

    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, processor);
  }

  clear(): void {
    this.cache.clear();
    // Note: WeakMap doesn't need manual clearing
  }
}

// Global processor cache instance
const processorCache = new ProcessorCache();

export const Markdown = (options: Readonly<Options>) => {
  const processor = getCachedProcessor(options);
  const content = options.children || "";
  return post(
    // biome-ignore lint/suspicious/noExplicitAny: runSync return type varies with processor configuration
    processor.runSync(processor.parse(content), content) as any,
    options
  );
};

const getCachedProcessor = (options: Readonly<Options>) => {
  // Try to get from cache first
  const cached = processorCache.get(options);
  if (cached) {
    return cached;
  }

  // Create new processor and cache it
  const processor = createProcessor(options);
  processorCache.set(options, processor);
  return processor;
};

const hasRehypeRaw = (plugins: PluggableList): boolean =>
  plugins.some((plugin) =>
    Array.isArray(plugin) ? plugin[0] === rehypeRaw : plugin === rehypeRaw
  );

const createProcessor = (options: Readonly<Options>) => {
  const rehypePlugins = options.rehypePlugins || EMPTY_PLUGINS;
  const remarkPlugins = options.remarkPlugins || EMPTY_PLUGINS;

  // When rehype-raw is NOT present, escape HTML to display it as text
  // When rehype-raw IS present, HTML is processed normally
  const finalRemarkPlugins = hasRehypeRaw(rehypePlugins)
    ? remarkPlugins
    : [...remarkPlugins, remarkEscapeHtml];

  const remarkRehypeOptions = options.remarkRehypeOptions
    ? { ...DEFAULT_REMARK_REHYPE_OPTIONS, ...options.remarkRehypeOptions }
    : DEFAULT_REMARK_REHYPE_OPTIONS;

  return unified()
    .use(remarkParse)
    .use(finalRemarkPlugins)
    .use(remarkRehype, remarkRehypeOptions)
    .use(rehypePlugins);
};

export const defaultUrlTransform: UrlTransform = (value) => value;

const post = (tree: Nodes, options: Readonly<Options>): ReactElement => {
  const {
    allowElement,
    allowedElements,
    disallowedElements,
    skipHtml,
    unwrapDisallowed,
    urlTransform,
  } = options;

  const hasFiltering =
    allowElement ||
    allowedElements ||
    disallowedElements ||
    skipHtml ||
    urlTransform;

  if (hasFiltering) {
    const transform = urlTransform || defaultUrlTransform;

    visit(tree as Root, (node, index, parent) => {
      if (node.type === "raw" && parent && typeof index === "number") {
        if (skipHtml) {
          parent.children.splice(index, 1);
        } else {
          parent.children[index] = { type: "text", value: node.value };
        }
        return index;
      }

      if (node.type === "element") {
        for (const key in urlAttributes) {
          if (
            Object.hasOwn(urlAttributes, key) &&
            Object.hasOwn(node.properties, key)
          ) {
            const value = node.properties[key];
            const test = urlAttributes[key];
            if (test === null || test.includes(node.tagName)) {
              node.properties[key] =
                transform(String(value || ""), key, node) ?? undefined;
            }
          }
        }

        let remove = allowedElements
          ? !allowedElements.includes(node.tagName)
          : disallowedElements
            ? disallowedElements.includes(node.tagName)
            : false;

        if (!remove && allowElement && typeof index === "number") {
          remove = !allowElement(node, index, parent);
        }

        if (remove && parent && typeof index === "number") {
          if (unwrapDisallowed && node.children) {
            parent.children.splice(index, 1, ...node.children);
          } else {
            parent.children.splice(index, 1);
          }
          return index;
        }
      }
    });
  }

  return toJsxRuntime(tree, {
    Fragment,
    components: options.components,
    ignoreInvalidStyle: true,
    jsx,
    jsxs,
    passKeys: true,
    passNode: true,
  });
};
