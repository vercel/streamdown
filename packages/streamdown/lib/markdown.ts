import type { Element, Nodes } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type { ComponentType, JSX, ReactElement } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import remarkParse from "remark-parse";
import type { Options as RemarkRehypeOptions } from "remark-rehype";
import remarkRehype from "remark-rehype";
import type { PluggableList } from "unified";
import { unified } from "unified";

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
};

// LRU Cache for unified processors
class ProcessorCache {
  // biome-ignore lint/suspicious/noExplicitAny: Processor type is complex and varies with plugins
  private readonly cache = new Map<string, any>();
  private readonly keyCache = new WeakMap<Readonly<Options>, string>();
  private readonly maxSize = 100;

  private generateCacheKey(options: Readonly<Options>): string {
    // Check WeakMap cache first for faster lookups
    const cachedKey = this.keyCache.get(options);
    if (cachedKey) {
      return cachedKey;
    }

    const rehypePlugins = options.rehypePlugins || [];
    const remarkPlugins = options.remarkPlugins || [];
    const remarkRehypeOptions = options.remarkRehypeOptions || {};

    // Create a stable key from plugin configurations using faster string concatenation
    const serializePlugins = (plugins: PluggableList): string => {
      let result = "";
      for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        if (i > 0) result += ",";

        if (Array.isArray(plugin)) {
          // Plugin with options: [plugin, options]
          const [pluginFn, pluginOptions] = plugin;
          result +=
            typeof pluginFn === "function" ? pluginFn.name : String(pluginFn);
          result += ":";
          result += JSON.stringify(pluginOptions);
        } else {
          // Plugin without options
          result += typeof plugin === "function" ? plugin.name : String(plugin);
        }
      }
      return result;
    };

    const rehypeKey = serializePlugins(rehypePlugins);
    const remarkKey = serializePlugins(remarkPlugins);
    const optionsKey = JSON.stringify(remarkRehypeOptions);

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
  // biome-ignore lint/suspicious/noExplicitAny: runSync return type varies with processor configuration
  return post(
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
