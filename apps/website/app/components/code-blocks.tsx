import { Renderer } from './renderer';

const markdown = `
\`\`\`tsx
import React from "react";

type ButtonProps = {
  label: string;
  onClick: () => void;
};

export const Button: React.FC<ButtonProps> = ({ label, onClick }) => (
  <button
    type="button"
    className="button"
    onClick={onClick}
    aria-label={label}
  >
    {label}
  </button>
);
\`\`\`
`;

export const CodeBlocks = () => (
  <section className="space-y-16 px-4">
    <div className="mx-auto max-w-2xl space-y-4 text-center">
      <h2 className="font-semibold text-4xl tracking-tight">
        Beautiful, interactive code blocks
      </h2>
      <p className="text-balance text-lg text-muted-foreground md:text-xl">
        Streamdown uses{' '}
        <a
          className="underline"
          href="https://shiki.style/"
          rel="noreferrer"
          target="_blank"
        >
          Shiki
        </a>{' '}
        to highlight code blocks, and comes with a copy button so you can easily
        copy the code.{' '}
        <span className="font-medium text-blue-600">
          Hover to reveal the copy button!
        </span>
      </p>
    </div>
    <div className="grid grid-cols-2 divide-x overflow-hidden rounded-3xl border">
      <div>
        <div className="w-full bg-secondary p-4 text-center">
          With react-markdown
        </div>
        <div className="h-[400px] overflow-y-auto p-4">
          <Renderer markdown={markdown} type="markdown" />
        </div>
      </div>
      <div>
        <div className="w-full bg-secondary p-4 text-center">
          With Streamdown
        </div>
        <div className="h-[400px] overflow-y-auto p-4">
          <Renderer markdown={markdown} type="streamdown" />
        </div>
      </div>
    </div>
  </section>
);
