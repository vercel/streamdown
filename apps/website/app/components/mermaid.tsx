import { Section } from './section';

export const MermaidDemo = () => {
  const mermaidExample = `# Mermaid Diagram Support

Create beautiful diagrams in streaming markdown with Streamdown. Here are some examples:

## Flowchart Example

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
\`\`\`

## Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant User
    participant API
    participant Database
    
    User->>API: Request data
    API->>Database: Query
    Database-->>API: Results
    API-->>User: Response
\`\`\`

## Class Diagram

\`\`\`mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +bark()
    }
    class Cat {
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat
\`\`\`

## Gantt Chart

\`\`\`mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Design
    UI Design           :done, design, 2024-01-01, 2024-01-15
    UX Design           :done, design, 2024-01-16, 2024-01-30
    section Development
    Frontend              :active, dev, 2024-02-01, 2024-03-15
    Backend               :dev, 2024-02-15, 2024-03-30
    section Testing
    Test Writing           :test, 2024-04-01, 2024-04-15
    Test Execution         :test, 2024-04-16, 2024-04-30
\`\`\``;

  return (
    <Section
      title="Mermaid Diagram Support"
      description={
        <>
          Create beautiful diagrams in streaming markdown with Streamdown.
          <br />
          Flowcharts, sequence diagrams, class diagrams, and more render seamlessly as you type.
        </>
      }
      markdown={mermaidExample}
      speed={50}
    />
  );
};
