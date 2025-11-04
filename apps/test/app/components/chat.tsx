"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Moon, Sun } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";

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
  const [isDark, setIsDark] = useState(false);
  const [showShiki, setShowShiki] = useState(true);
  const [showReactShiki, setShowReactShiki] = useState(true);

  useEffect(() => {
    // Check initial theme
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  return (
    <div className="mx-auto flex h-screen flex-col divide-y border-x">
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="font-semibold text-lg">Streamdown Test</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={showShiki ? "default" : "outline"}
            size="sm"
            onClick={() => setShowShiki(!showShiki)}
          >
            Shiki
          </Button>
          <Button
            variant={showReactShiki ? "default" : "outline"}
            size="sm"
            onClick={() => setShowReactShiki(!showReactShiki)}
          >
            React-Shiki
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
      </div>
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
        {(showShiki || showReactShiki) && (
          <div className="flex-[2] overflow-y-auto">
            <div
              className={cn(
                "grid divide-x",
                showShiki && showReactShiki
                  ? "grid-cols-2"
                  : "grid-cols-1"
              )}
            >
              {showShiki && (
                <div className="space-y-4 p-4">
                  <div className="sticky top-0 z-10 bg-background pb-2">
                    <h3 className="font-semibold text-sm">Shiki (Default)</h3>
                  </div>
                  {messages.map((message) => (
                    <div key={message.id}>
                      <span className="font-bold">
                        {message.role === "user" ? "User: " : "AI: "}
                      </span>
                      {message.parts.map((part, index) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <Streamdown
                                codeHighlighter="shiki"
                                isAnimating={status === "streaming"}
                                key={index}
                              >
                                {part.text}
                              </Streamdown>
                            );
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
              )}
              {showReactShiki && (
                <div className="space-y-4 p-4">
                  <div className="sticky top-0 z-10 bg-background pb-2">
                    <h3 className="font-semibold text-sm">React-Shiki</h3>
                  </div>
                  {messages.map((message) => (
                    <div key={message.id}>
                      <span className="font-bold">
                        {message.role === "user" ? "User: " : "AI: "}
                      </span>
                      {message.parts.map((part, index) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <Streamdown
                                codeHighlighter="react-shiki"
                                isAnimating={status === "streaming"}
                                key={index}
                              >
                                {part.text}
                              </Streamdown>
                            );
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
              )}
            </div>
          </div>
        )}
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
