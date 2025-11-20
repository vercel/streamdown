import { cleanup, render } from "@testing-library/react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { bench, describe } from "vitest";
import { Streamdown } from "../packages/streamdown";
import { parseMarkdownIntoBlocks } from "../packages/streamdown/lib/parse-blocks";
import { parseIncompleteMarkdown } from "../packages/streamdown/lib/parse-incomplete-markdown";
import { fixtures } from "./fixtures";

describe("Memory Usage: Parse Operations", () => {
  describe("parseMarkdownIntoBlocks", () => {
    bench("Small document", () => {
      parseMarkdownIntoBlocks(fixtures.small);
    });

    bench("Medium document", () => {
      parseMarkdownIntoBlocks(fixtures.medium);
    });

    bench("Large document", () => {
      parseMarkdownIntoBlocks(fixtures.large);
    });
  });

  describe("parseIncompleteMarkdown", () => {
    bench("Small document", () => {
      parseIncompleteMarkdown(fixtures.small);
    });

    bench("Streaming document (incomplete tokens)", () => {
      parseIncompleteMarkdown(fixtures.streaming);
    });

    bench("Large document", () => {
      parseIncompleteMarkdown(fixtures.large);
    });
  });
});

describe("Memory Usage: Component Rendering", () => {
  describe("Small Document", () => {
    bench("Streamdown (static)", () => {
      render(<Streamdown mode="static">{fixtures.small}</Streamdown>);
      cleanup();
    });

    bench("Streamdown (streaming)", () => {
      render(<Streamdown mode="streaming">{fixtures.small}</Streamdown>);
      cleanup();
    });

    bench("React Markdown", () => {
      render(
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {fixtures.small}
        </ReactMarkdown>
      );
      cleanup();
    });
  });

  describe("Medium Document", () => {
    bench("Streamdown (static)", () => {
      render(<Streamdown mode="static">{fixtures.medium}</Streamdown>);
      cleanup();
    });

    bench("Streamdown (streaming)", () => {
      render(<Streamdown mode="streaming">{fixtures.medium}</Streamdown>);
      cleanup();
    });

    bench("React Markdown", () => {
      render(
        <ReactMarkdown
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          remarkPlugins={[remarkGfm, remarkMath]}
        >
          {fixtures.medium}
        </ReactMarkdown>
      );
      cleanup();
    });
  });

  describe("Large Document", () => {
    bench("Streamdown (static)", () => {
      render(<Streamdown mode="static">{fixtures.large}</Streamdown>);
      cleanup();
    });

    bench("Streamdown (streaming)", () => {
      render(<Streamdown mode="streaming">{fixtures.large}</Streamdown>);
      cleanup();
    });

    bench("React Markdown", () => {
      render(
        <ReactMarkdown
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          remarkPlugins={[remarkGfm, remarkMath]}
        >
          {fixtures.large}
        </ReactMarkdown>
      );
      cleanup();
    });
  });

  describe("Code Heavy Document", () => {
    bench("Streamdown (static)", () => {
      render(<Streamdown mode="static">{fixtures.codeHeavy}</Streamdown>);
      cleanup();
    });

    bench("Streamdown (streaming)", () => {
      render(<Streamdown mode="streaming">{fixtures.codeHeavy}</Streamdown>);
      cleanup();
    });

    bench("React Markdown", () => {
      render(
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {fixtures.codeHeavy}
        </ReactMarkdown>
      );
      cleanup();
    });
  });
});

describe("Memory Usage: Streaming Simulation", () => {
  describe("Incremental Updates", () => {
    const content = fixtures.medium;
    const chunks = [
      content.substring(0, Math.floor(content.length * 0.25)),
      content.substring(0, Math.floor(content.length * 0.5)),
      content.substring(0, Math.floor(content.length * 0.75)),
      content,
    ];

    bench("Streamdown (streaming)", () => {
      const { rerender } = render(
        <Streamdown mode="streaming" parseIncompleteMarkdown>
          {chunks[0]}
        </Streamdown>
      );
      for (let i = 1; i < chunks.length; i++) {
        rerender(
          <Streamdown mode="streaming" parseIncompleteMarkdown>
            {chunks[i]}
          </Streamdown>
        );
      }
      cleanup();
    });

    bench("React Markdown", () => {
      const { rerender } = render(
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{chunks[0]}</ReactMarkdown>
      );
      for (let i = 1; i < chunks.length; i++) {
        rerender(
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{chunks[i]}</ReactMarkdown>
        );
      }
      cleanup();
    });
  });
});
