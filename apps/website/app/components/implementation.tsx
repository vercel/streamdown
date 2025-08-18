import { CodeBlock } from 'streamdown/lib/code-block';

const code = `'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { Streamdown } from 'streamdown';

export default function Page() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');

  return (
    <>
      {messages.map(message => (
        <div key={message.id}>
          {message.parts.filter(part => part.type === 'text').map((part, index) => (
            <Streamdown key={index}>{part.text}</Streamdown>
          ))}
        </div>
      ))}

      <form
        onSubmit={e => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput('');
          }
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={status !== 'ready'}
          placeholder="Say something..."
        />
        <button type="submit" disabled={status !== 'ready'}>
          Submit
        </button>
      </form>
    </>
  );
}
`;

export const Implementation = () => (
  <div className="grid grid-cols-12 divide-x">
    <div className="col-span-4 space-y-2 p-8">
      <h2 className="font-semibold text-2xl tracking-tight">Implementation</h2>
      <p className="text-muted-foreground">
        Streamdown is a drop-in replacement for react-markdown, designed for
        AI-powered streaming.
      </p>
      <p className="text-muted-foreground">
        Here's an example of how to use it with the{' '}
        <a
          className="font-medium text-blue-600 underline"
          href="https://ai-sdk.dev"
          rel="noreferrer"
          target="_blank"
        >
          Vercel AI SDK
        </a>
        .
      </p>
    </div>
    <div className="col-span-8 bg-background">
      <CodeBlock className="p-8" code={code} language="tsx" />
    </div>
  </div>
);
