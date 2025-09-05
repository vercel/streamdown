import { gateway } from "@ai-sdk/gateway";
import { Chat } from "./components/chat";

export default async function Page() {
  const { models } = await gateway.getAvailableModels();
  const list = models.map((model) => ({
    label: model.name,
    value: model.id,
  }));

  return <Chat models={list} />;
}
