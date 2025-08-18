import { Section } from './section';

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
  <Section
    description={
      <>
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
      </>
    }
    markdown={markdown}
    title="Beautiful, interactive code blocks"
  />
);
