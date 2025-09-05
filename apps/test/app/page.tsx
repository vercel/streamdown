import { gateway } from "@ai-sdk/gateway";
import { Chat } from "./components/chat";
import { ThemeSwitcher } from "./components/theme-switcher";

export default async function Page() {
  const { models } = await gateway.getAvailableModels();
  const list = models
    .filter((model) => !model.name.includes("embed"))
    .map((model) => ({
      label: model.name,
      value: model.id,
    }));

  return (
    <div className="relative h-screen">
      <div className="absolute top-4 right-4 z-10">
        <ThemeSwitcher />
      </div>
      <Chat models={list} />
    </div>
  );
}
