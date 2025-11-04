import { Chat } from "./components/chat";

export default async function Page() {
  // Define current Anthropic Claude models (late 2025)
  const list = [
    { label: "Claude Sonnet 4", value: "claude-sonnet-4-20250514" },
    { label: "Claude Opus 4", value: "claude-opus-4-20250514" },
    { label: "Claude 3.7 Sonnet", value: "claude-3-7-sonnet-20250219" },
    { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20241022" },
    { label: "Claude 3 Haiku", value: "claude-3-haiku-20240307" },
  ];

  return <Chat models={list} />;
}
