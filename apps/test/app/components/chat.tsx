"use client";

import { useChat } from "@ai-sdk/react";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { DefaultChatTransport, type UIMessage } from "ai";
import { CheckIcon, Columns3Icon, RotateCcwIcon } from "lucide-react";
import Image from "next/image";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import { harden } from "rehype-harden";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkCjkFriendlyGfmStrikethrough from "remark-cjk-friendly-gfm-strikethrough";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Column } from "./column";

interface ChatProps {
  models: {
    label: string;
    value: string;
  }[];
}

const COLUMN_IDS = [
  "raw",
  "react-markdown",
  "react-markdown-plugins",
  "streamdown",
  "streamdown-plugins",
] as const;

type ColumnId = (typeof COLUMN_IDS)[number];

const COLUMN_LABELS: Record<ColumnId, string> = {
  raw: "Raw",
  "react-markdown": "React Markdown",
  "react-markdown-plugins": "React Markdown with Plugins",
  streamdown: "Streamdown",
  "streamdown-plugins": "Streamdown with plugins",
};

const DEFAULT_VISIBLE_COLUMNS: ColumnId[] = [...COLUMN_IDS];
const VISIBLE_COLUMNS_STORAGE_KEY = "chat-visible-columns";
const RESTREAM_SPEED_MS = 40;

const gridColsClassName: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

const tokenize = (text: string) => text.split(/(\s+)/).filter(Boolean);

const getMessageText = (message: UIMessage) =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

const MessageLabel = ({
  role,
  onReplay,
  canReplay,
  isReplaying,
}: {
  role: UIMessage["role"];
  onReplay?: () => void;
  canReplay?: boolean;
  isReplaying?: boolean;
}) => (
  <div className="mb-1 flex items-center gap-1.5">
    <span className="font-bold">{role === "user" ? "User: " : "AI: "}</span>
    {role === "assistant" && onReplay ? (
      <Button
        aria-label="Replay message"
        className="h-5 gap-1 px-1.5 text-[11px]"
        disabled={!canReplay}
        onClick={onReplay}
        size="sm"
        type="button"
        variant="ghost"
      >
        <RotateCcwIcon className={cn("size-3", isReplaying && "animate-spin")} />
        Replay
      </Button>
    ) : null}
  </div>
);

const FilePart = ({
  part,
}: {
  part: Extract<UIMessage["parts"][number], { type: "file" }>;
}) => (
  <div>
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

export const Chat = ({ models }: ChatProps) => {
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");
  const [model, setModel] = useState(models[0].value);
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(
    DEFAULT_VISIBLE_COLUMNS
  );
  const [restreamId, setRestreamId] = useState<string | null>(null);
  const [restreamText, setRestreamText] = useState("");
  const restreamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const stopRestream = useCallback(() => {
    if (restreamIntervalRef.current) {
      clearInterval(restreamIntervalRef.current);
      restreamIntervalRef.current = null;
    }
    setRestreamId(null);
    setRestreamText("");
  }, []);

  const startRestream = useCallback(
    (message: UIMessage) => {
      const fullText = getMessageText(message);
      if (!fullText || status === "streaming") {
        return;
      }

      if (restreamIntervalRef.current) {
        clearInterval(restreamIntervalRef.current);
        restreamIntervalRef.current = null;
      }

      const tokens = tokenize(fullText);
      let index = 0;
      let current = "";

      setRestreamId(message.id);
      setRestreamText("");

      restreamIntervalRef.current = setInterval(() => {
        if (index >= tokens.length) {
          if (restreamIntervalRef.current) {
            clearInterval(restreamIntervalRef.current);
            restreamIntervalRef.current = null;
          }
          setRestreamId(null);
          setRestreamText("");
          return;
        }

        current += tokens[index];
        index += 1;
        setRestreamText(current);
      }, RESTREAM_SPEED_MS);
    },
    [status]
  );

  useEffect(() => () => stopRestream(), [stopRestream]);

  useEffect(() => {
    if (status === "streaming") {
      stopRestream();
    }
  }, [status, stopRestream]);

  useEffect(() => {
    const saved = localStorage.getItem("chat-model");
    if (saved && models.some((m) => m.value === saved)) {
      setModel(saved);
    }
  }, [models]);

  useEffect(() => {
    localStorage.setItem("chat-model", model);
  }, [model]);

  useEffect(() => {
    const saved = localStorage.getItem(VISIBLE_COLUMNS_STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        return;
      }

      const next = COLUMN_IDS.filter((id) => parsed.includes(id));
      if (next.length > 0) {
        setVisibleColumns(next);
      }
    } catch {
      // Ignore invalid stored values.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      VISIBLE_COLUMNS_STORAGE_KEY,
      JSON.stringify(visibleColumns)
    );
  }, [visibleColumns]);

  const toggleColumn = (id: ColumnId) => {
    setVisibleColumns((current) => {
      if (current.includes(id)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((columnId) => columnId !== id);
      }

      return COLUMN_IDS.filter(
        (columnId) => columnId === id || current.includes(columnId)
      );
    });
  };

  const getPartText = useCallback(
    (message: UIMessage, partText: string, isFirstTextPart: boolean) => {
      if (restreamId !== message.id) {
        return partText;
      }
      // During replay, stream the joined message text through the first text part.
      return isFirstTextPart ? restreamText : "";
    },
    [restreamId, restreamText]
  );

  const isLiveStreaming = status === "streaming" || restreamId !== null;
  const canReplay = status === "ready" && restreamId === null;

  const columns = useMemo(() => {
    const renderLabel = (message: UIMessage) => (
      <MessageLabel
        canReplay={canReplay && Boolean(getMessageText(message))}
        isReplaying={restreamId === message.id}
        onReplay={
          message.role === "assistant"
            ? () => startRestream(message)
            : undefined
        }
        role={message.role}
      />
    );

    const items: { id: ColumnId; content: ReactNode }[] = [
      {
        id: "raw",
        content: messages.map((message) => {
          let textPartSeen = false;
          return (
            <div key={message.id}>
              {renderLabel(message)}
              {message.parts.map((part, index) => {
                const key = `${message.id}-${index}`;
                switch (part.type) {
                  case "text": {
                    const isFirstTextPart = !textPartSeen;
                    textPartSeen = true;
                    return (
                      <pre className="whitespace-pre-wrap" key={key}>
                        {getPartText(message, part.text, isFirstTextPart)}
                      </pre>
                    );
                  }
                  case "reasoning":
                    return (
                      <pre className="italic" key={key}>
                        {part.text}
                      </pre>
                    );
                  case "file":
                    return <FilePart key={key} part={part} />;
                  default:
                    return null;
                }
              })}
            </div>
          );
        }),
      },
      {
        id: "react-markdown",
        content: messages.map((message) => {
          let textPartSeen = false;
          return (
            <div key={message.id}>
              {renderLabel(message)}
              {message.parts.map((part, index) => {
                const key = `${message.id}-${index}`;
                switch (part.type) {
                  case "text": {
                    const isFirstTextPart = !textPartSeen;
                    textPartSeen = true;
                    return (
                      <ReactMarkdown key={key}>
                        {getPartText(message, part.text, isFirstTextPart)}
                      </ReactMarkdown>
                    );
                  }
                  case "reasoning":
                    return (
                      <pre className="italic" key={key}>
                        {part.text}
                      </pre>
                    );
                  case "file":
                    return <FilePart key={key} part={part} />;
                  default:
                    return null;
                }
              })}
            </div>
          );
        }),
      },
      {
        id: "react-markdown-plugins",
        content: messages.map((message) => {
          let textPartSeen = false;
          return (
            <div key={message.id}>
              {renderLabel(message)}
              {message.parts.map((part, index) => {
                const key = `${message.id}-${index}`;
                switch (part.type) {
                  case "text": {
                    const isFirstTextPart = !textPartSeen;
                    textPartSeen = true;
                    return (
                      <ReactMarkdown
                        key={key}
                        rehypePlugins={[
                          [
                            harden,
                            {
                              allowedImagePrefixes: ["*"],
                              allowedLinkPrefixes: ["*"],
                              allowedProtocols: ["*"],
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
                        {getPartText(message, part.text, isFirstTextPart)}
                      </ReactMarkdown>
                    );
                  }
                  case "reasoning":
                    return (
                      <pre className="italic" key={key}>
                        {part.text}
                      </pre>
                    );
                  case "file":
                    return <FilePart key={key} part={part} />;
                  default:
                    return null;
                }
              })}
            </div>
          );
        }),
      },
      {
        id: "streamdown",
        content: messages.map((message, messageIndex) => {
          let textPartSeen = false;
          const isActiveAssistant =
            message.role === "assistant" &&
            (restreamId === message.id ||
              (status === "streaming" && messageIndex === messages.length - 1));

          return (
            <div key={message.id}>
              {renderLabel(message)}
              {message.parts.map((part, index) => {
                const key = `${message.id}-${index}`;
                switch (part.type) {
                  case "text": {
                    const isFirstTextPart = !textPartSeen;
                    textPartSeen = true;
                    return (
                      <Streamdown
                        caret={isActiveAssistant ? "block" : undefined}
                        isAnimating={isActiveAssistant && isLiveStreaming}
                        key={key}
                      >
                        {getPartText(message, part.text, isFirstTextPart)}
                      </Streamdown>
                    );
                  }
                  case "reasoning":
                    return (
                      <Streamdown className="italic" key={key}>
                        {part.text}
                      </Streamdown>
                    );
                  case "file":
                    return <FilePart key={key} part={part} />;
                  default:
                    return null;
                }
              })}
            </div>
          );
        }),
      },
      {
        id: "streamdown-plugins",
        content: messages.map((message, messageIndex) => {
          let textPartSeen = false;
          const isActiveAssistant =
            message.role === "assistant" &&
            (restreamId === message.id ||
              (status === "streaming" && messageIndex === messages.length - 1));

          return (
            <div key={message.id}>
              {renderLabel(message)}
              {message.parts.map((part, index) => {
                const key = `${message.id}-${index}`;
                switch (part.type) {
                  case "text": {
                    const isFirstTextPart = !textPartSeen;
                    textPartSeen = true;
                    return (
                      <Streamdown
                        animated
                        caret={isActiveAssistant ? "block" : undefined}
                        isAnimating={isActiveAssistant && isLiveStreaming}
                        key={key}
                        plugins={{ code, mermaid, math, cjk }}
                      >
                        {getPartText(message, part.text, isFirstTextPart)}
                      </Streamdown>
                    );
                  }
                  case "reasoning":
                    return (
                      <Streamdown className="italic" key={key}>
                        {part.text}
                      </Streamdown>
                    );
                  case "file":
                    return <FilePart key={key} part={part} />;
                  default:
                    return null;
                }
              })}
            </div>
          );
        }),
      },
    ];

    return items.filter((column) => visibleColumns.includes(column.id));
  }, [
    canReplay,
    getPartText,
    isLiveStreaming,
    messages,
    restreamId,
    startRestream,
    status,
    visibleColumns,
  ]);

  return (
    <div className="mx-auto flex h-screen flex-col divide-y overflow-hidden border-x">
      <div
        className={cn(
          "grid h-full flex-1 divide-x overflow-hidden",
          gridColsClassName[columns.length] ?? "grid-cols-1"
        )}
      >
        {columns.map((column) => (
          <Column key={column.id} title={COLUMN_LABELS[column.id]}>
            {column.content}
          </Column>
        ))}
      </div>
      <form
        className="grid shrink-0 items-center gap-2 divide-y p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            stopRestream();
            sendMessage({ text: input }, { body: { model } });
            setInput("");
          }
        }}
      >
        <Textarea
          disabled={status !== "ready"}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Say something... (⌘↵ to send)"
          value={input}
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
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

            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline">
                  <Columns3Icon />
                  Columns
                  <span className="text-muted-foreground">
                    {visibleColumns.length}/{COLUMN_IDS.length}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-2">
                <div className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
                  Toggle columns
                </div>
                <div className="flex flex-col gap-0.5">
                  {COLUMN_IDS.map((id) => {
                    const checked = visibleColumns.includes(id);
                    const disableUncheck =
                      checked && visibleColumns.length === 1;

                    return (
                      <button
                        aria-pressed={checked}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                          disableUncheck && "opacity-50"
                        )}
                        disabled={disableUncheck}
                        key={id}
                        onClick={() => toggleColumn(id)}
                        type="button"
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-sm border border-input",
                            checked &&
                              "border-primary bg-primary text-primary-foreground"
                          )}
                        >
                          {checked ? <CheckIcon className="size-3" /> : null}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {COLUMN_LABELS[id]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              onClick={() => {
                stopRestream();
                setMessages([]);
              }}
              type="button"
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
