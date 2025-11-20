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

// Helper to measure memory usage
interface MemoryResult {
  heapUsed: number;
  external: number;
}

const measureMemory = (fn: () => void, iterations = 100): MemoryResult => {
  // Force GC if available
  if (global.gc) {
    global.gc();
  }

  const beforeHeap = process.memoryUsage().heapUsed;
  const beforeExternal = process.memoryUsage().external;

  // Run multiple iterations to get measurable memory impact
  for (let i = 0; i < iterations; i++) {
    fn();
  }

  const afterHeap = process.memoryUsage().heapUsed;
  const afterExternal = process.memoryUsage().external;

  return {
    heapUsed: (afterHeap - beforeHeap) / iterations,
    external: (afterExternal - beforeExternal) / iterations,
  };
};

describe("Memory Usage: Parse Operations", () => {
  describe("parseMarkdownIntoBlocks", () => {
    bench("Small document", () => {
      measureMemory(() => {
        parseMarkdownIntoBlocks(fixtures.small);
      });
    });

    bench("Medium document", () => {
      measureMemory(() => {
        parseMarkdownIntoBlocks(fixtures.medium);
      });
    });

    bench("Large document", () => {
      measureMemory(() => {
        parseMarkdownIntoBlocks(fixtures.large);
      });
    });
  });

  describe("parseIncompleteMarkdown", () => {
    bench("Small document", () => {
      measureMemory(() => {
        parseIncompleteMarkdown(fixtures.small);
      });
    });

    bench("Streaming document (incomplete tokens)", () => {
      measureMemory(() => {
        parseIncompleteMarkdown(fixtures.streaming);
      });
    });

    bench("Large document", () => {
      measureMemory(() => {
        parseIncompleteMarkdown(fixtures.large);
      });
    });
  });
});

describe("Memory Usage: Component Rendering", () => {
  describe("Small Document", () => {
    bench("Streamdown (static)", () => {
      measureMemory(() => {
        render(<Streamdown mode="static">{fixtures.small}</Streamdown>);
        cleanup();
      }, 50);
    });

    bench("Streamdown (streaming)", () => {
      measureMemory(() => {
        render(<Streamdown mode="streaming">{fixtures.small}</Streamdown>);
        cleanup();
      }, 50);
    });

    bench("React Markdown", () => {
      measureMemory(() => {
        render(
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {fixtures.small}
          </ReactMarkdown>
        );
        cleanup();
      }, 50);
    });
  });

  describe("Medium Document", () => {
    bench("Streamdown (static)", () => {
      measureMemory(() => {
        render(<Streamdown mode="static">{fixtures.medium}</Streamdown>);
        cleanup();
      }, 50);
    });

    bench("Streamdown (streaming)", () => {
      measureMemory(() => {
        render(<Streamdown mode="streaming">{fixtures.medium}</Streamdown>);
        cleanup();
      }, 50);
    });

    bench("React Markdown", () => {
      measureMemory(() => {
        render(
          <ReactMarkdown
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            remarkPlugins={[remarkGfm, remarkMath]}
          >
            {fixtures.medium}
          </ReactMarkdown>
        );
        cleanup();
      }, 50);
    });
  });

  describe("Large Document", () => {
    bench("Streamdown (static)", () => {
      measureMemory(() => {
        render(<Streamdown mode="static">{fixtures.large}</Streamdown>);
        cleanup();
      }, 25);
    });

    bench("Streamdown (streaming)", () => {
      measureMemory(() => {
        render(<Streamdown mode="streaming">{fixtures.large}</Streamdown>);
        cleanup();
      }, 25);
    });

    bench("React Markdown", () => {
      measureMemory(() => {
        render(
          <ReactMarkdown
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            remarkPlugins={[remarkGfm, remarkMath]}
          >
            {fixtures.large}
          </ReactMarkdown>
        );
        cleanup();
      }, 25);
    });
  });

  describe("Code Heavy Document", () => {
    bench("Streamdown (static)", () => {
      measureMemory(() => {
        render(<Streamdown mode="static">{fixtures.codeHeavy}</Streamdown>);
        cleanup();
      }, 25);
    });

    bench("Streamdown (streaming)", () => {
      measureMemory(() => {
        render(<Streamdown mode="streaming">{fixtures.codeHeavy}</Streamdown>);
        cleanup();
      }, 25);
    });

    bench("React Markdown", () => {
      measureMemory(() => {
        render(
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {fixtures.codeHeavy}
          </ReactMarkdown>
        );
        cleanup();
      }, 25);
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
      measureMemory(() => {
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
      }, 20);
    });

    bench("React Markdown", () => {
      measureMemory(() => {
        const { rerender } = render(
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{chunks[0]}</ReactMarkdown>
        );
        for (let i = 1; i < chunks.length; i++) {
          rerender(
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {chunks[i]}
            </ReactMarkdown>
          );
        }
        cleanup();
      }, 20);
    });
  });
});
