"use client";

import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { cjk as releasedCjk } from "@streamdown-released/cjk";
import { code as releasedCode } from "@streamdown-released/code";
import { math as releasedMath } from "@streamdown-released/math";
import { mermaid as releasedMermaid } from "@streamdown-released/mermaid";
import { useCallback, useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { Streamdown as ReleasedStreamdown } from "streamdown-released";
import "streamdown/styles.css";
import "streamdown-released/styles.css";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Column } from "../components/column";
import { SAMPLE_MARKDOWN } from "./sample";

type Target = "released" | "local";

interface Output {
  isAnimating: boolean;
  text: string;
}

interface CompareProps {
  localVersion: string;
  releasedVersion: string;
}

const releasedPlugins = {
  code: releasedCode,
  mermaid: releasedMermaid,
  math: releasedMath,
  cjk: releasedCjk,
};
const localPlugins = { code, mermaid, math, cjk };

const DEFAULT_CHARS_PER_TICK = 5;
const DEFAULT_INTERVAL_MS = 30;
const IDLE_OUTPUT: Output = { text: "", isAnimating: false };

type Mode = "idle" | "live" | "released" | "local" | "both";

const MODE_LABELS: Record<Mode, string> = {
  idle: "Idle",
  live: "Streaming both in sync",
  released: "Streaming released",
  local: "Streaming local",
  both: "Streaming released → local",
};

const clampInt = (value: number, min: number, max: number) =>
  Math.min(
    max,
    Math.max(min, Math.round(Number.isFinite(value) ? value : min))
  );

export const Compare = ({ localVersion, releasedVersion }: CompareProps) => {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [released, setReleased] = useState<Output>(IDLE_OUTPUT);
  const [local, setLocal] = useState<Output>(IDLE_OUTPUT);
  const [mode, setMode] = useState<Mode>("idle");
  const [charsPerTick, setCharsPerTick] = useState(DEFAULT_CHARS_PER_TICK);
  const [intervalMs, setIntervalMs] = useState(DEFAULT_INTERVAL_MS);

  // Refs so speed changes apply to a stream that is already running.
  const charsPerTickRef = useRef(charsPerTick);
  const intervalMsRef = useRef(intervalMs);
  charsPerTickRef.current = charsPerTick;
  intervalMsRef.current = intervalMs;

  const runIdRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const setOutput = useCallback((target: Target, output: Output) => {
    (target === "released" ? setReleased : setLocal)(output);
  }, []);

  const stop = useCallback(() => {
    runIdRef.current += 1;
    clearTimers();
    setReleased((prev) => ({ ...prev, isAnimating: false }));
    setLocal((prev) => ({ ...prev, isAnimating: false }));
    setMode("idle");
  }, [clearTimers]);

  /**
   * Streams `text` into every target in lockstep. Resolves false if cancelled
   * by another run.
   */
  const streamInto = useCallback(
    (targets: Target[], text: string, runId: number) =>
      new Promise<boolean>((resolve) => {
        let position = 0;
        for (const target of targets) {
          setOutput(target, { text: "", isAnimating: true });
        }

        const tick = () => {
          if (runIdRef.current !== runId) {
            resolve(false);
            return;
          }
          position = Math.min(text.length, position + charsPerTickRef.current);
          const done = position >= text.length;
          const output = { text: text.slice(0, position), isAnimating: !done };
          for (const target of targets) {
            setOutput(target, output);
          }
          if (done) {
            timeoutRef.current = null;
            resolve(true);
            return;
          }
          timeoutRef.current = setTimeout(tick, intervalMsRef.current);
        };

        timeoutRef.current = setTimeout(tick, intervalMsRef.current);
      }),
    [setOutput]
  );

  /** Each phase streams its targets together; phases run one after another. */
  const startStream = useCallback(
    async (phases: Target[][], nextMode: Mode) => {
      runIdRef.current += 1;
      const runId = runIdRef.current;
      clearTimers();
      setMode(nextMode);

      // Clear every column that is about to stream so the sequence is obvious.
      for (const target of phases.flat()) {
        setOutput(target, IDLE_OUTPUT);
      }

      for (const targets of phases) {
        const completed = await streamInto(targets, markdown, runId);
        if (!completed) {
          return;
        }
      }
      if (runIdRef.current === runId) {
        setMode("idle");
      }
    },
    [clearTimers, markdown, setOutput, streamInto]
  );

  return (
    <div className="flex h-dvh flex-col divide-y overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-2 p-3">
        <Button
          onClick={() => startStream([["released", "local"]], "live")}
          size="sm"
          variant={mode === "live" ? "default" : "outline"}
        >
          Live sync stream
        </Button>
        <Button
          onClick={() => startStream([["released"]], "released")}
          size="sm"
          variant={mode === "released" ? "default" : "outline"}
        >
          Stream released
        </Button>
        <Button
          onClick={() => startStream([["local"]], "local")}
          size="sm"
          variant={mode === "local" ? "default" : "outline"}
        >
          Stream local
        </Button>
        <Button
          onClick={() => startStream([["released"], ["local"]], "both")}
          size="sm"
          variant={mode === "both" ? "default" : "outline"}
        >
          Stream both (released → local)
        </Button>
        <Button
          disabled={mode === "idle"}
          onClick={stop}
          size="sm"
          variant="ghost"
        >
          Stop
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">Chars / tick</span>
            <input
              className="w-32"
              max={200}
              min={1}
              onChange={(event) =>
                setCharsPerTick(clampInt(event.target.valueAsNumber, 1, 200))
              }
              type="range"
              value={charsPerTick}
            />
            <input
              className="w-16 rounded-md border bg-transparent px-2 py-1"
              max={10_000}
              min={1}
              onChange={(event) =>
                setCharsPerTick(clampInt(event.target.valueAsNumber, 1, 10_000))
              }
              type="number"
              value={charsPerTick}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">Interval (ms)</span>
            <input
              className="w-16 rounded-md border bg-transparent px-2 py-1"
              max={2000}
              min={1}
              onChange={(event) =>
                setIntervalMs(clampInt(event.target.valueAsNumber, 1, 2000))
              }
              type="number"
              value={intervalMs}
            />
          </label>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              mode === "idle"
                ? "bg-secondary text-muted-foreground"
                : "bg-primary text-primary-foreground"
            )}
          >
            {MODE_LABELS[mode]}
          </span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-1 divide-x">
        <Column title={`Markdown input · ${markdown.length} chars`}>
          <textarea
            className="block h-full w-full resize-none bg-transparent font-mono text-sm outline-none"
            onChange={(event) => setMarkdown(event.target.value)}
            spellCheck={false}
            value={markdown}
          />
        </Column>
        <Column
          title={`Released · streamdown@${releasedVersion} · ${released.text.length}/${markdown.length}`}
        >
          {/* `relative` contains absolutely positioned children (e.g. the sr-only footnote label) inside the scroll area. */}
          <div className="relative">
            <ReleasedStreamdown
              animated
              caret={released.isAnimating ? "block" : undefined}
              isAnimating={released.isAnimating}
              plugins={releasedPlugins}
            >
              {released.text}
            </ReleasedStreamdown>
          </div>
        </Column>
        <Column
          title={`Local · streamdown@${localVersion} (workspace) · ${local.text.length}/${markdown.length}`}
        >
          <div className="relative">
            <Streamdown
              animated
              caret={local.isAnimating ? "block" : undefined}
              isAnimating={local.isAnimating}
              plugins={localPlugins}
            >
              {local.text}
            </Streamdown>
          </div>
        </Column>
      </div>
    </div>
  );
};
