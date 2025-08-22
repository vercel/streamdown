import { Streamdown } from 'streamdown';

export const MermaidDemo = () => {
  const flowchartExample = `
# Flowchart Example

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
\`\`\`

# Sequence Diagram Example

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

# Class Diagram Example

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

# Gantt Chart Example

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
\`\`\`
  `;

  return (
    <section className="py-16">
      <div className="px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Mermaid Diagram Support
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Create beautiful diagrams in streaming markdown with Streamdown.
              Flowcharts, sequence diagrams, class diagrams and more.
            </p>
          </div>
          
          <div className="mt-12">
            <Streamdown>{flowchartExample}</Streamdown>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              The examples above are created using Mermaid syntax.
              <br />
              Define your diagrams using the
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                ```mermaid
              </code> block.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
