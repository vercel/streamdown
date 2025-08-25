import { Section } from './section';

export const MermaidDemo = () => {
  const mermaidExample = `Interactive diagram rendering with manual control. Click the chart icon next to any Mermaid code block to render it!

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
          Streamdown supports Mermaid diagrams, rendered automatically with the
          option to view the source code.
        </>
      }
      markdown={mermaidExample}
      speed={60}
      title="Interactive Mermaid Diagrams"
    />
  );
};
