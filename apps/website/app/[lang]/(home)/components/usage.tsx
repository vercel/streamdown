import Link from "next/link";
import { codeToHtml } from "shiki";
import { CodeBlock } from "@/components/geistdocs/code-block";
import { Button } from "@/components/ui/button";

const exampleCode = `import { useChat } from "@ai-sdk/react";
import { Streamdown } from "streamdown";
import { codePlugin } from "@streamdown/code";
import { mermaidPlugin } from "@streamdown/mermaid";
import { mathPlugin } from "@streamdown/math";
import { cjkPlugin } from "@streamdown/cjk";
import "katex/dist/katex.min.css";

export default function Chat() {
  const { messages, isLoading } = useChat();

  return (
    <div>
      {messages.map((m) => (
        <Streamdown
          key={m.id}
          plugins={{
            code: codePlugin,
            mermaid: mermaidPlugin,
            math: mathPlugin,
            cjk: cjkPlugin,
          }}
          isAnimating={isLoading}
        >
          {m.content}
        </Streamdown>
      ))}
    </div>
  );
}`;

export const Usage = async () => {
  const [light, dark] = await Promise.all([
    codeToHtml(exampleCode, {
      lang: "tsx",
      theme: "github-light",
    }),
    codeToHtml(exampleCode, {
      lang: "tsx",
      theme: "github-dark",
    }),
  ]);

  return (
    <section className="space-y-16 py-16">
      <div className="mx-auto max-w-3xl space-y-4 px-4 text-center sm:px-8">
        <h2 className="text-pretty font-semibold text-2xl tracking-tighter sm:text-3xl md:text-4xl">
          Get started in seconds
        </h2>
        <p className="text-balance text-muted-foreground sm:text-lg md:text-xl">
          Install only what you need. Plugins are optional and tree-shakeable
          for minimal bundle size.
        </p>
        <Button asChild variant="outline">
          <Link href="/docs/getting-started">Read the install guide</Link>
        </Button>
      </div>
      <div className="mx-auto max-w-3xl">
        <div className="dark:hidden">
          <CodeBlock title="app/chat/page.tsx">
            <code
              className="language-tsx"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
              dangerouslySetInnerHTML={{ __html: light }}
            />
          </CodeBlock>
        </div>
        <div className="hidden dark:block">
          <CodeBlock title="app/chat/page.tsx">
            <code
              className="language-tsx"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
              dangerouslySetInnerHTML={{ __html: dark }}
            />
          </CodeBlock>
        </div>
      </div>
    </section>
  );
};
