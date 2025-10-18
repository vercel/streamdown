import { gateway } from "@ai-sdk/gateway";
import { Chat } from "./components/chat";

// ISR: Generate on-demand, cache for 5 minutes
export const revalidate = 300;

export default async function Page() {
  const { models } = await gateway.getAvailableModels();
  const list = models
    .filter((model) => !model.name.includes("embed"))
    .map((model) => ({
      label: model.name,
      value: model.id,
    }));

  return <Chat models={list} />;
}
