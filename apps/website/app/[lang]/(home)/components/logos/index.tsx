import { cn } from "@/lib/utils";
import {
  Cloudflare,
  Dify,
  ElevenLabs,
  Langfuse,
  Mastra,
  Mintlify,
  Ollama,
  Supabase,
  Trigger,
  Upstash,
} from "./files";

const logos = [
  { name: "Mintlify", src: Mintlify },
  { name: "Ollama", src: Ollama },
  { name: "Supabase", src: Supabase },
  { name: "Trigger", src: Trigger },
  { name: "Mastra", src: Mastra },
  { name: "Cloudflare", src: Cloudflare },
  { name: "ElevenLabs", src: ElevenLabs },
  { name: "Upstash", src: Upstash },
  { name: "Langfuse", src: Langfuse },
  { name: "Dify", src: Dify },
];

export const Logos = () => (
  <section>
    <div className="p-8 text-center font-medium text-muted-foreground text-sm">
      <p>Powering AI experiences for</p>
    </div>
    <div className="grid grid-cols-2 border-t md:grid-cols-5">
      {logos.map((logo, index) => (
        <div
          className={cn(
            "flex items-center justify-center p-8",
            // Mobile: every even index (0,2,4,6,8) gets border-r
            index % 2 === 0 && "border-r",
            // MD: remove border-r if last in 5-col row
            index % 2 === 0 && index % 5 === 4 && "md:border-r-0",
            // MD: add border-r for odd indices not last in 5-col row
            index % 2 !== 0 && index % 5 !== 4 && "md:border-r",
            // Mobile: all except last 2 get border-b
            index < logos.length - 2 && "border-b",
            // MD: remove border-b for items 5-7 (last 5 on md, not last 2 on mobile)
            index >= logos.length - 5 && index < logos.length - 2 && "md:border-b-0"
          )}
          key={logo.name}
        >
          <logo.src />
        </div>
      ))}
    </div>
  </section>
);
