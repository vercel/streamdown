import { bench, describe } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";
import { Streamdown } from "../packages/streamdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { fixtures } from "./fixtures";

// Cleanup after each benchmark to prevent memory leaks
const cleanupRender = () => {
  cleanup();
};

describe("Render Time: Streamdown vs React Markdown", () => {
  describe("Small Document - Static Mode", () => {
    const content = fixtures.small;

    bench(
      "Streamdown (static)",
      () => {
        render(<Streamdown mode="static">{content}</Streamdown>);
      },
      { afterEach: cleanupRender }
    );

    bench(
      "React Markdown",
      () => {
        render(<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>);
      },
      { afterEach: cleanupRender }
    );
  });

  describe("Small Document - Streaming Mode", () => {
    const content = fixtures.small;

    bench(
      "Streamdown (streaming)",
      () => {
        render(<Streamdown mode="streaming">{content}</Streamdown>);
      },
      { afterEach: cleanupRender }
    );

    bench(
      "React Markdown (baseline)",
      () => {
        render(<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>);
      },
      { afterEach: cleanupRender }
    );
  });

  describe("Medium Document - Static Mode", () => {
    const content = fixtures.medium;

    bench(
      "Streamdown (static)",
      () => {
        render(<Streamdown mode="static">{content}</Streamdown>);
      },
      { afterEach: cleanupRender }
    );

    bench(
      "React Markdown",
      () => {
        render(
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
          >
            {content}
          </ReactMarkdown>
        );
      },
      { afterEach: cleanupRender }
    );
  });

  describe("Medium Document - Streaming Mode", () => {
    const content = fixtures.medium;

    bench(
      "Streamdown (streaming)",
      () => {
        render(<Streamdown mode="streaming">{content}</Streamdown>);
      },
      { afterEach: cleanupRender }
    );

    bench(
      "React Markdown (baseline)",
      () => {
        render(
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
          >
            {content}
          </ReactMarkdown>
        );
      },
      { afterEach: cleanupRender }
    );
  });

  describe("Large Document - Static Mode", () => {
    const content = fixtures.large;

    bench(
      "Streamdown (static)",
      () => {
        render(<Streamdown mode="static">{content}</Streamdown>);
      },
      { afterEach: cleanupRender }
    );

    bench(
      "React Markdown",
      () => {
        render(
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
          >
            {content}
          </ReactMarkdown>
        );
      },
      { afterEach: cleanupRender }
    );
  });

  describe("Large Document - Streaming Mode", () => {
    const content = fixtures.large;

    bench(
      "Streamdown (streaming)",
      () => {
        render(<Streamdown mode="streaming">{content}</Streamdown>);
      },
      { afterEach: cleanupRender }
    );

    bench(
      "React Markdown (baseline)",
      () => {
        render(
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
          >
            {content}
          </ReactMarkdown>
        );
      },
      { afterEach: cleanupRender }
    );
  });

  describe("Code Heavy Document", () => {
    const content = fixtures.codeHeavy;

    bench(
      "Streamdown (static)",
      () => {
        render(<Streamdown mode="static">{content}</Streamdown>);
      },
      { afterEach: cleanupRender }
    );

    bench(
      "Streamdown (streaming)",
      () => {
        render(<Streamdown mode="streaming">{content}</Streamdown>);
      },
      { afterEach: cleanupRender }
    );

    bench(
      "React Markdown",
      () => {
        render(<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>);
      },
      { afterEach: cleanupRender }
    );
  });
});

describe("Render Time: With Incomplete Markdown", () => {
  describe("Streaming Document - parseIncompleteMarkdown ON", () => {
    const content = fixtures.streaming;

    bench(
      "Streamdown (with parseIncompleteMarkdown)",
      () => {
        render(
          <Streamdown mode="streaming" parseIncompleteMarkdown>
            {content}
          </Streamdown>
        );
      },
      { afterEach: cleanupRender }
    );

    bench(
      "Streamdown (without parseIncompleteMarkdown)",
      () => {
        render(
          <Streamdown mode="streaming" parseIncompleteMarkdown={false}>
            {content}
          </Streamdown>
        );
      },
      { afterEach: cleanupRender }
    );

    bench(
      "React Markdown (no protection)",
      () => {
        render(<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>);
      },
      { afterEach: cleanupRender }
    );
  });
});

describe("Re-render Performance", () => {
  describe("Multiple Re-renders (Small Document)", () => {
    const content = fixtures.small;

    bench(
      "Streamdown (streaming) - 10 re-renders",
      () => {
        const { rerender } = render(
          <Streamdown mode="streaming">{content}</Streamdown>
        );
        for (let i = 0; i < 10; i++) {
          rerender(<Streamdown mode="streaming">{content}</Streamdown>);
        }
      },
      { afterEach: cleanupRender }
    );

    bench(
      "React Markdown - 10 re-renders",
      () => {
        const { rerender } = render(
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        );
        for (let i = 0; i < 10; i++) {
          rerender(<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>);
        }
      },
      { afterEach: cleanupRender }
    );
  });

  describe("Incremental Content Updates (Simulated Streaming)", () => {
    const content = fixtures.medium;
    const chunks = [
      content.substring(0, Math.floor(content.length * 0.25)),
      content.substring(0, Math.floor(content.length * 0.5)),
      content.substring(0, Math.floor(content.length * 0.75)),
      content,
    ];

    bench(
      "Streamdown (streaming)",
      () => {
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
      },
      { afterEach: cleanupRender }
    );

    bench(
      "React Markdown",
      () => {
        const { rerender } = render(
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{chunks[0]}</ReactMarkdown>
        );
        for (let i = 1; i < chunks.length; i++) {
          rerender(<ReactMarkdown remarkPlugins={[remarkGfm]}>{chunks[i]}</ReactMarkdown>);
        }
      },
      { afterEach: cleanupRender }
    );
  });
});
