import { Section } from "./section";

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
        Streamdown uses{" "}
        <a
          className="underline"
          href="https://shiki.style/"
          rel="noreferrer"
          target="_blank"
        >
          Shiki
        </a>{" "}
        to highlight code blocks, and comes with copy and download buttons in
        the header.
      </>
    }
    markdown={markdown}
    title="Beautiful, interactive code blocks"
  />
);
