'use client';

import { useChat } from '@ai-sdk/react';
import { Streamdown } from 'streamdown';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === 'user' ? 'text-right' : 'text-left'
            }
          >
            <div className="inline-block max-w-2xl">
              <Streamdown
                isAnimating={
                  isLoading && message.role === 'assistant'
                }
              >
                {message.content}
              </Streamdown>
            </div>
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
