'use client';

import { useChat } from '@ai-sdk/react';
import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';

export default function ChatWithCaret() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div key={message.id}>
            <Streamdown
              plugins={{ code }}
              caret="block"
              isAnimating={
                isLoading &&
                index === messages.length - 1 &&
                message.role === 'assistant'
              }
            >
              {message.content}
            </Streamdown>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask me anything..."
          className="w-full rounded-lg border px-4 py-2"
          disabled={isLoading}
        />
      </form>
    </div>
  );
}
