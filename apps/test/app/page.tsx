"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { Streamdown } from "streamdown";

export default function Page() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");

  return (
    <div className="mx-auto flex h-screen max-w-4xl flex-col divide-y border-x">
      <div className="flex flex-1 divide-x overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto bg-black p-4 text-white">
          {messages.map((message) => (
            <div key={message.id}>
              <span className="font-bold">
                {message.role === "user" ? "User: " : "AI: "}
              </span>
              {message.parts.map((part, index) => {
                switch (part.type) {
                  case "text":
                    return (
                      <pre className="whitespace-pre-wrap" key={index}>
                        {part.text}
                      </pre>
                    );
                  case "reasoning":
                    return (
                      <pre className="italic" key={index}>
                        {part.text}
                      </pre>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          ))}
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message) => (
            <div key={message.id}>
              <span className="font-bold">
                {message.role === "user" ? "User: " : "AI: "}
              </span>
              {message.parts.map((part, index) => {
                switch (part.type) {
                  case "text":
                    return <Streamdown key={index}>{part.text}</Streamdown>;
                  case "reasoning":
                    return (
                      <p className="italic" key={part.text}>
                        {part.text}
                      </p>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          ))}
        </div>
      </div>
      <form
        className="flex shrink-0 items-center gap-2 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput("");
          }
        }}
      >
        <input
          className="flex-1 rounded-md border border-neutral-200 p-2"
          disabled={status !== "ready"}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something..."
          value={input}
        />
        <button
          className="shrink-0 rounded-md bg-blue-500 px-4 py-2 text-white"
          disabled={status !== "ready"}
          type="submit"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
