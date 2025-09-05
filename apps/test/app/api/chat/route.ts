import { convertToModelMessages, streamText, type UIMessage } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model }: { messages: UIMessage[]; model: string } =
    await req.json();

  console.log("Running model:", model);

  const result = streamText({
    model,
    system: "You are a helpful assistant.",
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
