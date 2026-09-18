import type { GeistdocsAgentReadinessConfig } from "@vercel/geistdocs/config";
import { ArrowDownWideNarrowIcon } from "lucide-react";

export const Logo = () => (
  <>
    <span className="hidden font-semibold text-xl tracking-tight sm:block">
      Streamdown
    </span>
    <ArrowDownWideNarrowIcon className="sm:hidden" />
  </>
);

export const github = {
  branch: "main",
  editPath: "apps/website/content/docs/{path}",
  owner: "vercel",
  repo: "streamdown",
};

export const nav = [
  {
    label: "Docs",
    href: "/docs",
  },
  {
    label: "Features",
    href: "/docs/animation",
  },
  {
    label: "Plugins",
    href: "/docs/plugins",
  },
  {
    label: "Playground",
    href: "/playground",
  },
];

export const suggestions = [
  "What is Streamdown?",
  "How does unterminated markdown parsing work?",
  "How is Streamdown secure?",
  "Is Streamdown performance optimized?",
];

export const title = "Streamdown Documentation";

export const prompt =
  "You are a helpful assistant specializing in answering questions about Streamdown - a markdown renderer designed for streaming content from AI models that is highly interactive, customizable, and easy to use.";

export const agent = {
  product: {
    name: "Streamdown",
    description:
      "Streamdown is a markdown renderer designed for streaming content from AI models. It is highly interactive, customizable, and easy to use.",
    category: "AI / React components",
    audience: ["React developers", "AI application developers"],
    useCases: [
      "Render streaming markdown from AI models",
      "Build chat interfaces with rich markdown output",
      "Display code blocks, math, diagrams, and CJK text from LLM responses",
    ],
  },
  links: [
    {
      label: "Streamdown source",
      href: `https://github.com/${github.owner}/${github.repo}`,
      description: "Source repository for Streamdown and its plugins",
    },
  ],
} satisfies GeistdocsAgentReadinessConfig;

export const translations = {
  en: {
    displayName: "English",
  },
};

export const basePath: string | undefined = undefined;

export const siteId: string | undefined = "streamdown";
