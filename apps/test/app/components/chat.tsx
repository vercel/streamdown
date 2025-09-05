"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Image from "next/image";
import { useState } from "react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/kibo-ui/combobox";
import { Textarea } from "@/components/ui/textarea";

type ChatProps = {
  models: {
    label: string;
    value: string;
  }[];
};

export const Chat = ({ models }: ChatProps) => {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");
  const [model, setModel] = useState(models[0].value);

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
                  case "file":
                    return (
                      <div key={index}>
                        {part.mediaType.startsWith("image") ? (
                          <Image
                            alt={part.filename ?? "An image attachment"}
                            height={100}
                            src={part.url}
                            unoptimized
                            width={100}
                          />
                        ) : (
                          <div>File: {part.filename}</div>
                        )}
                      </div>
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
                  case "file":
                    return (
                      <div key={index}>
                        {part.mediaType.startsWith("image") ? (
                          <Image
                            alt={part.filename ?? "An image attachment"}
                            height={100}
                            src={part.url}
                            unoptimized
                            width={100}
                          />
                        ) : (
                          <div>File: {part.filename}</div>
                        )}
                      </div>
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
        className="grid shrink-0 items-center gap-2 divide-y p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input }, { body: { model } });
            setInput("");
          }
        }}
      >
        <Textarea
          disabled={status !== "ready"}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something..."
          value={input}
        />
        <div className="flex items-center justify-between gap-2">
          <Combobox
            data={models}
            onValueChange={setModel}
            type="model"
            value={model}
          >
            <ComboboxTrigger className="w-full max-w-sm" />
            <ComboboxContent>
              <ComboboxInput />
              <ComboboxEmpty />
              <ComboboxList>
                <ComboboxGroup>
                  {models.map((currentModel) => (
                    <ComboboxItem
                      key={currentModel.value}
                      value={currentModel.value}
                    >
                      {currentModel.label}
                    </ComboboxItem>
                  ))}
                </ComboboxGroup>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <Button disabled={status !== "ready"} type="submit">
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
};
