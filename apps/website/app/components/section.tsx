"use client";

import { RefreshCcwIcon } from "lucide-react";
import { useInView } from "motion/react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Streamdown, type StreamdownProps } from "streamdown";
import { chunkText } from "streamdown/lib/smooth-stream";
import { Button } from "@/components/ui/button";

const DEFAULT_SPEED = 100;
type WordByWordStreamdownProps = {
  markdown: string;
  speed?: number;
  streamdownProps?: StreamdownProps;
  start?: boolean;
  resetKey?: number;
};

const WordByWordStreamdown = ({
  markdown,
  speed = DEFAULT_SPEED,
  streamdownProps,
  start = true,
  resetKey,
}: WordByWordStreamdownProps) => {
  const [content, setContent] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunks = useMemo(() => chunkText(markdown, "word"), [markdown]);

  useEffect(() => {
    if (!start) {
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setContent("");
    let index = 0;
    let current = "";

    intervalRef.current = setInterval(() => {
      if (index < chunks.length) {
        current += chunks[index];
        setContent(current);
        index++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [start, resetKey, speed, chunks]);

  return <Streamdown {...streamdownProps}>{content}</Streamdown>;
};


type SectionProps = {
  title: string;
  description: string | ReactNode;
  markdown: string;
  streamdownProps?: StreamdownProps;
  speed?: number;
};

export const Section = ({
  title,
  description,
  markdown,
  streamdownProps,
  speed = DEFAULT_SPEED,
}: SectionProps) => {
  const [content, setContent] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const ref = useRef(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const tokens = useMemo(
    () => chunkText(markdown, "line"),
    [markdown]
  );

  useEffect(() => {
    if (!isInView && resetTrigger === 0) {
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset content and start animation
    setContent("");
    setIsAnimating(true);
    let currentContent = "";
    let index = 0;

    intervalRef.current = setInterval(() => {
      if (index < tokens.length) {
        currentContent += tokens[index];
        setContent(currentContent);
        index++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsAnimating(false);
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [speed, tokens, isInView, resetTrigger]);

  const reset = () => {
    // Stop current animation if running
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Trigger re-run of animation
    setResetTrigger((prev) => prev + 1);
  };

  return (
    <section className="space-y-16 pt-16">
      <div className="mx-auto max-w-3xl space-y-4 px-4 text-center sm:px-8">
        <h2 className="text-pretty font-semibold text-2xl tracking-tighter sm:text-3xl md:text-4xl">
          {title}
        </h2>
        <p className="text-balance text-muted-foreground sm:text-lg md:text-xl">
          {description}
        </p>
      </div>
      <div className="relative">
        <div
          className="divide-y overflow-hidden border-t sm:grid md:grid-cols-2 md:divide-x md:divide-y-0"
          ref={ref}
        >
          <div className="divide-y">
            <div className="w-full bg-dashed p-4 text-center font-medium text-muted-foreground text-sm">
              With react-markdown
            </div>
            <div className="h-[400px] overflow-y-auto bg-background p-4">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
          <div className="divide-y">
            <div className="w-full bg-dashed p-4 text-center font-medium text-muted-foreground text-sm">
              With Streamdown
            </div>
            <div className="h-[400px] overflow-y-auto bg-background p-4">
              <WordByWordStreamdown
                markdown={markdown}
                speed={speed / 5}
                streamdownProps={streamdownProps}
                start={isInView || resetTrigger > 0}
                resetKey={resetTrigger}
              />
            </div>
          </div>
        </div>
        {!isAnimating && (
          <Button
            className="-translate-x-1/2 absolute bottom-0 left-1/2 translate-y-1/2 cursor-pointer rounded-full disabled:opacity-80"
            disabled={isAnimating}
            onClick={reset}
          >
            <RefreshCcwIcon
              className={`size-4 ${isAnimating ? "animate-spin" : ""}`}
            />
            Reset
          </Button>
        )}
      </div>
    </section>
  );
};
