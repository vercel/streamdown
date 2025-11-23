"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Image from "next/image";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { harden } from "rehype-harden";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkCjkFriendlyGfmStrikethrough from "remark-cjk-friendly-gfm-strikethrough";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
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
import { Column } from "./column";

type ChatProps = {
  models: {
    label: string;
    value: string;
  }[];
};

export const Chat = ({ models }: ChatProps) => {
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");
  const [model, setModel] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chat-model");
      return saved && models.some((m) => m.value === saved)
        ? saved
        : models[0].value;
    }
    return models[0].value;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chat-model", model);
    }
  }, [model]);

  return (
    <div className="mx-auto flex h-screen flex-col divide-y overflow-hidden border-x">
      <div className="grid h-full flex-1 grid-cols-4 divide-x overflow-hidden">
        <Column title="Raw">
          {messages.map((message) => (
            <div key={message.id}>
              <span className="font-bold">
                {message.role === "user" ? "User: " : "AI: "}
              </span>
              {message.parts.map((part, index) => {
                const key = `${message.id}-${index}`;
                switch (part.type) {
                  case "text":
                    return (
                      <pre className="whitespace-pre-wrap" key={key}>
                        {part.text}
                      </pre>
                    );
                  case "reasoning":
                    return (
                      <pre className="italic" key={key}>
                        {part.text}
                      </pre>
                    );
                  case "file":
                    return (
                      <div key={key}>
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
        </Column>

        <Column title="React Markdown">
          {messages.map((message) => (
            <div key={message.id}>
              <span className="font-bold">
                {message.role === "user" ? "User: " : "AI: "}
              </span>
              {message.parts.map((part, index) => {
                const key = `${message.id}-${index}`;
                switch (part.type) {
                  case "text":
                    return <ReactMarkdown key={key}>{part.text}</ReactMarkdown>;
                  case "reasoning":
                    return (
                      <pre className="italic" key={key}>
                        {part.text}
                      </pre>
                    );
                  case "file":
                    return (
                      <div key={key}>
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
        </Column>

        <Column title="React Markdown with Plugins">
          {messages.map((message) => (
            <div key={message.id}>
              <span className="font-bold">
                {message.role === "user" ? "User: " : "AI: "}
              </span>
              {message.parts.map((part, index) => {
                const key = `${message.id}-${index}`;
                switch (part.type) {
                  case "text":
                    return (
                      <ReactMarkdown
                        key={key}
                        rehypePlugins={[
                          [
                            harden,
                            {
                              allowedImagePrefixes: ["*"],
                              allowedLinkPrefixes: ["*"],
                              defaultOrigin: undefined,
                              allowDataImages: true,
                            },
                          ],
                          rehypeRaw,
                          [
                            rehypeKatex,
                            { errorColor: "var(--color-muted-foreground)" },
                          ],
                        ]}
                        remarkPlugins={[
                          [remarkGfm, {}],
                          [remarkMath, { singleDollarTextMath: false }],
                          [remarkCjkFriendly, {}],
                          [remarkCjkFriendlyGfmStrikethrough, {}],
                        ]}
                      >
                        {part.text}
                      </ReactMarkdown>
                    );
                  case "reasoning":
                    return (
                      <pre className="italic" key={key}>
                        {part.text}
                      </pre>
                    );
                  case "file":
                    return (
                      <div key={key}>
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
        </Column>

        <Column title="Streamdown">
          {messages.map((message) => (
            <div key={message.id}>
              <span className="font-bold">
                {message.role === "user" ? "User: " : "AI: "}
              </span>
              {message.parts.map((part, index) => {
                const key = `${message.id}-${index}`;
                switch (part.type) {
                  case "text":
                    return (
                      <Streamdown
                        isAnimating={status === "streaming"}
                        key={key}
                      >
                        {part.text}
                      </Streamdown>
                    );
                  case "reasoning":
                    return (
                      <p className="italic" key={key}>
                        {part.text}
                      </p>
                    );
                  case "file":
                    return (
                      <div key={key}>
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
        </Column>
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

          <div className="flex items-center justify-between gap-2">
            <Button
              onClick={() => {
                setMessages([]);
              }}
              variant="outline"
            >
              Clear Chat
            </Button>
            <Button disabled={status !== "ready"} type="submit">
              Submit
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
