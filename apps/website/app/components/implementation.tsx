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
  <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
    <div className="space-y-2 p-8">
      <h2 className="font-semibold text-2xl tracking-tight">Overview</h2>
      <p className="text-muted-foreground">
        Formatting Markdown is easy, but when you tokenize and stream it, new
        challenges arise.
      </p>
      <p className="text-muted-foreground">
        With{' '}
        <a
          className="font-medium text-blue-600 underline"
          href="https://ai-sdk.dev/elements"
          rel="noopener noreferrer"
          target="_blank"
        >
          AI Elements
        </a>
        , we wanted to a way to stream safe and perfectly formatted Markdown
        without having to worry about the details.
      </p>
      <p className="text-muted-foreground">
        So we built Streamdown, a drop-in replacement for react-markdown,
        designed for AI-powered streaming.
      </p>
      <p className="text-muted-foreground">
        It powers the AI Elements{' '}
        <a
          className="font-medium text-blue-600 underline"
          href="https://ai-sdk.dev/elements/components/response"
          rel="noopener noreferrer"
          target="_blank"
        >
          Response
        </a>{' '}
        component, but you can install it as a standalone package if you want.
      </p>
    </div>
    <div className="overflow-x-hidden bg-background sm:col-span-2">
      <CodeBlock className="p-8" code={code} language="tsx" />
    </div>
  </div>
);
