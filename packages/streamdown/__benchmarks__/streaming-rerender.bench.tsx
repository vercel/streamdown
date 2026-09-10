/**
 * The markdown components are memoized, so the cost of their comparators shows
 * up on the streaming path — mount once, then re-render as the text grows — and
 * not in the parse benchmarks. This measures that path directly.
 */

import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { bench, describe } from "vitest";
import { Streamdown } from "../index";

const PROSE = `# Quarterly review

Revenue grew across every region this quarter, with **enterprise** leading and
*self-serve* close behind. See the [summary](https://example.com) for detail.

- Enterprise: up 18%
- Self-serve: up 11%
- Partner: flat

> Retention held at 94%.

| Region | Growth |
| ------ | ------ |
| NA     | 14%    |
| EMEA   | 9%     |
`;

const WITH_CODE = `${PROSE}
\`\`\`ts
export const rate = (a: number, b: number) => a / b;
\`\`\`
`;

const TAIL_WORDS =
  "and the trailing narrative continues to arrive one token at a time until the block is finally complete".split(
    " "
  );

function streamInto(document: string, steps: number) {
  const host = window.document.createElement("div");
  window.document.body.appendChild(host);
  const root = createRoot(host);

  flushSync(() => {
    root.render(<Streamdown>{document}</Streamdown>);
  });

  let tail = "";
  for (let i = 0; i < steps; i++) {
    tail += `${TAIL_WORDS[i % TAIL_WORDS.length]} `;
    flushSync(() => {
      root.render(<Streamdown>{`${document}\n\n${tail}`}</Streamdown>);
    });
  }

  flushSync(() => {
    root.unmount();
  });
  host.remove();
}

describe("Streaming re-render", () => {
  bench("prose document, 20 streaming appends", () => {
    streamInto(PROSE, 20);
  });

  bench("document with a code block, 20 streaming appends", () => {
    streamInto(WITH_CODE, 20);
  });
});
