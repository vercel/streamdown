// source.config.ts
import { remarkMdxMermaid } from "fumadocs-core/mdx-plugins";
import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema
} from "fumadocs-mdx/config";
var docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true
    }
  },
  meta: {
    schema: metaSchema
  }
});
var source_config_default = defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMdxMermaid]
  }
});
export {
  source_config_default as default,
  docs
};
