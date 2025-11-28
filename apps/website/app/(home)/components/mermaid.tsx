"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Section } from "./section";

export const MermaidDemo = () => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const mermaidExample = `Interactive diagram rendering with manual control. Use the fullscreen, download, and copy buttons to interact with any Mermaid diagram.

## Simple Flowchart

\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Success]
    B -->|No| D[Try Again]
    D --> B
    C --> E[End]
\`\`\`

## Process Flow

\`\`\`mermaid
flowchart LR
    A[User Input] --> B[Validate]
    B --> C{Valid?}
    C -->|Yes| D[Process]
    C -->|No| E[Show Error]
    D --> F[Save Result]
    E --> A
    F --> G[Complete]
\`\`\`

## API Sequence

\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant A as App
    participant S as Server
    
    U->>A: Click render
    A->>S: API Request
    S-->>A: Response
    A-->>U: Show diagram
\`\`\``;

  return (
    <Section
      description={
        <>
          Streamdown supports Mermaid diagrams with customizable themes and
          fullscreen viewing. Theme automatically adapts to light/dark mode.
        </>
      }
      markdown={mermaidExample}
      speed={60}
      streamdownProps={{
        mermaid: {
          config: {
            theme: resolvedTheme === "dark" ? "dark" : "default",
          },
        },
        controls: true,
      }}
      title="Interactive Mermaid Diagrams"
    />
  );
};
