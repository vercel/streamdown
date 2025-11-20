import { cleanup, render } from "@testing-library/react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { bench, describe } from "vitest";
import { Streamdown } from "../packages/streamdown";
import { fixtures } from "./fixtures";

// Helper to simulate streaming by breaking content into chunks
const createStreamingChunks = (
  content: string,
  chunkCount: number
): string[] => {
  const chunks: string[] = [];
  const chunkSize = Math.ceil(content.length / chunkCount);

  for (let i = 0; i < chunkCount; i++) {
    const start = 0;
    const end = Math.min((i + 1) * chunkSize, content.length);
    chunks.push(content.substring(start, end));
  }

  return chunks;
};

// Helper to simulate character-by-character streaming
const createCharacterChunks = (
  content: string,
  charsPerChunk: number
): string[] => {
  const chunks: string[] = [];
  for (let i = charsPerChunk; i <= content.length; i += charsPerChunk) {
    chunks.push(content.substring(0, i));
  }
  // Add final chunk if not already included
  if (chunks[chunks.length - 1] !== content) {
    chunks.push(content);
  }
  return chunks;
};

describe("Streaming Performance: Small Updates", () => {
  describe("Character-by-character (50 chars/update) - Medium Document", () => {
    const content = fixtures.medium;
    const chunks = createCharacterChunks(content, 50);

    bench("Streamdown (streaming with parseIncompleteMarkdown)", () => {
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

    bench("Streamdown (streaming without parseIncompleteMarkdown)", () => {
      const { rerender } = render(
        <Streamdown mode="streaming" parseIncompleteMarkdown={false}>
          {chunks[0]}
        </Streamdown>
      );

      for (let i = 1; i < chunks.length; i++) {
        rerender(
          <Streamdown mode="streaming" parseIncompleteMarkdown={false}>
            {chunks[i]}
          </Streamdown>
        );
      }
      cleanup();
    });

    bench("React Markdown", () => {
      const { rerender } = render(
        <ReactMarkdown
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          remarkPlugins={[remarkGfm, remarkMath]}
        >
          {chunks[0]}
        </ReactMarkdown>
      );

      for (let i = 1; i < chunks.length; i++) {
        rerender(
          <ReactMarkdown
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            remarkPlugins={[remarkGfm, remarkMath]}
          >
            {chunks[i]}
          </ReactMarkdown>
        );
      }
      cleanup();
    });
  });

  describe("Character-by-character (100 chars/update) - Medium Document", () => {
    const content = fixtures.medium;
    const chunks = createCharacterChunks(content, 100);

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
        <ReactMarkdown
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          remarkPlugins={[remarkGfm, remarkMath]}
        >
          {chunks[0]}
        </ReactMarkdown>
      );

      for (let i = 1; i < chunks.length; i++) {
        rerender(
          <ReactMarkdown
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            remarkPlugins={[remarkGfm, remarkMath]}
          >
            {chunks[i]}
          </ReactMarkdown>
        );
      }
      cleanup();
    });
  });
});

describe("Streaming Performance: Large Updates", () => {
  describe("10 chunks - Large Document", () => {
    const content = fixtures.large;
    const chunks = createStreamingChunks(content, 10);

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
        <ReactMarkdown
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          remarkPlugins={[remarkGfm, remarkMath]}
        >
          {chunks[0]}
        </ReactMarkdown>
      );

      for (let i = 1; i < chunks.length; i++) {
        rerender(
          <ReactMarkdown
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            remarkPlugins={[remarkGfm, remarkMath]}
          >
            {chunks[i]}
          </ReactMarkdown>
        );
      }
      cleanup();
    });
  });

  describe("25 chunks - Large Document", () => {
    const content = fixtures.large;
    const chunks = createStreamingChunks(content, 25);

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
        <ReactMarkdown
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          remarkPlugins={[remarkGfm, remarkMath]}
        >
          {chunks[0]}
        </ReactMarkdown>
      );

      for (let i = 1; i < chunks.length; i++) {
        rerender(
          <ReactMarkdown
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            remarkPlugins={[remarkGfm, remarkMath]}
          >
            {chunks[i]}
          </ReactMarkdown>
        );
      }
      cleanup();
    });
  });
});

describe("Streaming Performance: Code-Heavy Content", () => {
  describe("10 chunks - Code Heavy Document", () => {
    const content = fixtures.codeHeavy;
    const chunks = createStreamingChunks(content, 10);

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

describe("Streaming Performance: Incomplete Markdown Handling", () => {
  describe("Streaming document with incomplete tokens", () => {
    // Simulate streaming where tokens might be incomplete at chunk boundaries
    const incompleteChunks = [
      "# Hello\n\nThis is **bold text that gets cut",
      "# Hello\n\nThis is **bold text that gets cut of",
      "# Hello\n\nThis is **bold text that gets cut off**\n\nAnd some _italic text",
      "# Hello\n\nThis is **bold text that gets cut off**\n\nAnd some _italic text that continues_",
    ];

    bench("Streamdown (with parseIncompleteMarkdown)", () => {
      const { rerender } = render(
        <Streamdown mode="streaming" parseIncompleteMarkdown>
          {incompleteChunks[0]}
        </Streamdown>
      );

      for (let i = 1; i < incompleteChunks.length; i++) {
        rerender(
          <Streamdown mode="streaming" parseIncompleteMarkdown>
            {incompleteChunks[i]}
          </Streamdown>
        );
      }
      cleanup();
    });

    bench("Streamdown (without parseIncompleteMarkdown)", () => {
      const { rerender } = render(
        <Streamdown mode="streaming" parseIncompleteMarkdown={false}>
          {incompleteChunks[0]}
        </Streamdown>
      );

      for (let i = 1; i < incompleteChunks.length; i++) {
        rerender(
          <Streamdown mode="streaming" parseIncompleteMarkdown={false}>
            {incompleteChunks[i]}
          </Streamdown>
        );
      }
      cleanup();
    });

    bench("React Markdown", () => {
      const { rerender } = render(
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {incompleteChunks[0]}
        </ReactMarkdown>
      );

      for (let i = 1; i < incompleteChunks.length; i++) {
        rerender(
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {incompleteChunks[i]}
          </ReactMarkdown>
        );
      }
      cleanup();
    });
  });
});

describe("Streaming Performance: Real-world AI Streaming Simulation", () => {
  describe("Simulated AI response streaming", () => {
    // Simulate realistic AI token streaming with variable chunk sizes
    const content = fixtures.medium;
    const aiChunks: string[] = [];
    let currentPos = 0;

    // Create realistic AI-like chunks (5-15 chars per chunk)
    while (currentPos < content.length) {
      const chunkSize = Math.floor(Math.random() * 10) + 5; // 5-15 chars
      const nextPos = Math.min(currentPos + chunkSize, content.length);
      aiChunks.push(content.substring(0, nextPos));
      currentPos = nextPos;
    }

    bench("Streamdown (streaming)", () => {
      const { rerender } = render(
        <Streamdown mode="streaming" parseIncompleteMarkdown>
          {aiChunks[0]}
        </Streamdown>
      );

      // Simulate every 5th update for performance (still realistic)
      for (let i = 5; i < aiChunks.length; i += 5) {
        rerender(
          <Streamdown mode="streaming" parseIncompleteMarkdown>
            {aiChunks[i]}
          </Streamdown>
        );
      }
      cleanup();
    });

    bench("React Markdown", () => {
      const { rerender } = render(
        <ReactMarkdown
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          remarkPlugins={[remarkGfm, remarkMath]}
        >
          {aiChunks[0]}
        </ReactMarkdown>
      );

      for (let i = 5; i < aiChunks.length; i += 5) {
        rerender(
          <ReactMarkdown
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            remarkPlugins={[remarkGfm, remarkMath]}
          >
            {aiChunks[i]}
          </ReactMarkdown>
        );
      }
      cleanup();
    });
  });
});
