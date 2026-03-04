import {
  AWS,
  Cloudflare,
  Dify,
  ElevenLabs,
  GoogleCloud,
  HuggingFace,
  Langfuse,
  Mastra,
  Mintlify,
  Moonshot,
  Ollama,
  Sentry,
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
  { name: "Sentry", src: Sentry },
  { name: "Moonshot AI", src: Moonshot },
  { name: "AWS", src: AWS },
  { name: "Google Cloud", src: GoogleCloud },
  { name: "HuggingFace", src: HuggingFace },
];

export const Logos = () => (
  <section className="grid gap-8 p-12">
    <div className="text-center font-medium text-muted-foreground text-sm">
      <p>Powering AI experiences for</p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-5">
      {logos.map((logo) => (
        <div className="flex items-center justify-center p-8" key={logo.name}>
          <logo.src className="max-h-10" />
        </div>
      ))}
    </div>
  </section>
);
