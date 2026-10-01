import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

// TEMPORARY: remove once https://github.com/vercel/geistdocs/pull/402 is merged and released.
// Then pass `markdown: { remarkPlugins: [remarkMath] }` to `createSource` and delete this file.
// Geistdocs re-parses processed Markdown as MDX without remark-math, so LaTeX like `{\sin x}` crashes it.
// Math is masked with hex tokens before that pass and restored in `markdown.transform`.
const TOKEN_PATTERN = /geistdocsmath([0-9a-f]+)end/g;

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

const encode = (value: string) =>
  `geistdocsmath${Buffer.from(value, "utf8").toString("hex")}end`;

export const maskMath = (markdown: string) => {
  const ranges: [number, number][] = [];

  visit(parser.parse(markdown), ["math", "inlineMath"], (node) => {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;

    if (start !== undefined && end !== undefined) {
      ranges.push([start, end]);
    }
  });

  let result = markdown;

  for (const [start, end] of ranges.reverse()) {
    result =
      result.slice(0, start) +
      encode(result.slice(start, end)) +
      result.slice(end);
  }

  return result;
};

export const unmaskMath = (markdown: string) =>
  markdown.replace(TOKEN_PATTERN, (_match, hex: string) =>
    Buffer.from(hex, "hex").toString("utf8")
  );

interface Collection<T> {
  toFumadocsSource(): T;
}

type PageText = (type: "processed" | "raw") => Promise<string>;

export const withMaskedMath = <
  T extends { files: { type: string; data: unknown }[] },
>(
  collection: Collection<T>
): Collection<T> => ({
  toFumadocsSource() {
    const source = collection.toFumadocsSource();

    return {
      ...source,
      files: source.files.map((file) => {
        if (file.type !== "page") {
          return file;
        }

        const data = file.data as { getText: PageText };

        return {
          ...file,
          data: {
            ...data,
            getText: async (type: "processed" | "raw") => {
              const text = await data.getText(type);
              return type === "processed" ? maskMath(text) : text;
            },
          },
        };
      }),
    };
  },
});
