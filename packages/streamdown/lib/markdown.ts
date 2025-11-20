import type { Element, Nodes } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { urlAttributes } from "html-url-attributes";
import type { ComponentType, JSX, ReactElement } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import remarkParse from "remark-parse";
import type { Options as RemarkRehypeOptions } from "remark-rehype";
import remarkRehype from "remark-rehype";
import type { PluggableList } from "unified";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { VFile } from "vfile";

export type ExtraProps = {
  node?: Element | undefined;
};

export type Components = {
  [Key in keyof JSX.IntrinsicElements]?:
    | ComponentType<JSX.IntrinsicElements[Key] & ExtraProps>
    | keyof JSX.IntrinsicElements;
};

export type Options = {
  children?: string;
  components?: Components;
  rehypePlugins?: PluggableList;
  remarkPlugins?: PluggableList;
  remarkRehypeOptions?: Readonly<RemarkRehypeOptions>;
  urlTransform?: UrlTransform;
};

export type UrlTransform = (
  url: string,
  key: string,
  node: Readonly<Element>
) => string | null | undefined;

const safeProtocol = /^(https?|ircs?|mailto|xmpp)$/i;

// LRU Cache for unified processors
// biome-ignore lint/suspicious/noExplicitAny: Processor type is complex and varies with plugins
class ProcessorCache {
  private cache = new Map<string, any>();
  private maxSize = 100;

  private generateCacheKey(options: Readonly<Options>): string {
    const rehypePlugins = options.rehypePlugins || [];
    const remarkPlugins = options.remarkPlugins || [];
    const remarkRehypeOptions = options.remarkRehypeOptions || {};

    // Create a stable key from plugin configurations
    const serializePlugins = (plugins: PluggableList): string => {
      return JSON.stringify(
        plugins.map((plugin) => {
          if (Array.isArray(plugin)) {
            // Plugin with options: [plugin, options]
            const [pluginFn, pluginOptions] = plugin;
            return {
              name:
                typeof pluginFn === "function"
                  ? pluginFn.name
                  : String(pluginFn),
              options: pluginOptions,
            };
          }
          // Plugin without options
          return {
            name: typeof plugin === "function" ? plugin.name : String(plugin),
            options: null,
          };
        })
      );
    };

    const rehypeKey = serializePlugins(rehypePlugins);
    const remarkKey = serializePlugins(remarkPlugins);
    const optionsKey = JSON.stringify(remarkRehypeOptions);

    return `${remarkKey}::${rehypeKey}::${optionsKey}`;
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
  }
}

// Global processor cache instance
const processorCache = new ProcessorCache();

export const Markdown = (options: Readonly<Options>) => {
  const processor = getCachedProcessor(options);
  const file = new VFile(options.children || "");
  // biome-ignore lint/suspicious/noExplicitAny: runSync return type varies with processor configuration
  return post(processor.runSync(processor.parse(file), file) as any, options);
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

const createProcessor = (options: Readonly<Options>) => {
  const rehypePlugins = options.rehypePlugins || [];
  const remarkPlugins = options.remarkPlugins || [];
  const remarkRehypeOptions = {
    allowDangerousHtml: true,
    ...options.remarkRehypeOptions,
  };

  return unified()
    .use(remarkParse)
    .use(remarkPlugins)
    .use(remarkRehype, remarkRehypeOptions)
    .use(rehypePlugins);
};

function post(tree: Nodes, options: Readonly<Options>): ReactElement {
  const urlTransform = options.urlTransform || defaultUrlTransform;

  const transform = (node: Nodes): void => {
    if (node.type === "element") {
      let key: string;

      for (key in urlAttributes) {
        if (
          Object.hasOwn(urlAttributes, key) &&
          Object.hasOwn(node.properties, key)
        ) {
          const value = node.properties[key];
          const test = urlAttributes[key as keyof typeof urlAttributes];
          if (test === null || test.includes(node.tagName)) {
            node.properties[key] = urlTransform(String(value || ""), key, node);
          }
        }
      }
    }
  };

  visit(tree, transform);

  return toJsxRuntime(tree, {
    Fragment,
    components: options.components,
    ignoreInvalidStyle: true,
    jsx,
    jsxs,
    passKeys: true,
    passNode: true,
  });
}

export const defaultUrlTransform = (value: string) => {
  const colon = value.indexOf(":");
  const questionMark = value.indexOf("?");
  const numberSign = value.indexOf("#");
  const slash = value.indexOf("/");

  if (
    colon === -1 ||
    (slash !== -1 && colon > slash) ||
    (questionMark !== -1 && colon > questionMark) ||
    (numberSign !== -1 && colon > numberSign) ||
    safeProtocol.test(value.slice(0, colon))
  ) {
    return value;
  }

  return "";
};
