'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';
import { Streamdown } from 'streamdown';

export default function Page() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });
  const [input, setInput] = useState('');

  return (
    <div className="mx-auto flex h-screen max-w-xl flex-col divide-y divide-neutral-200 border-neutral-200 border-x">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id}>
            <span className="font-bold">
              {message.role === 'user' ? 'User: ' : 'AI: '}
            </span>
            {message.parts.map((part, index) =>
              part.type === 'text' ? (
                <Streamdown key={index}>{part.text}</Streamdown>
              ) : null
            )}
          </div>
        ))}
      </div>
      <form
        className="flex shrink-0 items-center gap-2 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput('');
          }
        }}
      >
        <input
          className="flex-1 rounded-md border border-neutral-200 p-2"
          disabled={status !== 'ready'}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something..."
          value={input}
        />
        <button
          className="shrink-0 rounded-md bg-blue-500 px-4 py-2 text-white"
          disabled={status !== 'ready'}
          type="submit"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
