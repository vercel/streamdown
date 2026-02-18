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
  owner: "vercel",
  repo: "streamdown",
};

export const nav = [
  {
    label: "Docs",
    href: "/docs",
  },
  {
    label: "Playground",
    href: "/playground",
  },
  {
    label: "AI Elements",
    href: "https://ai-sdk.dev/elements",
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
  "You are a helpful assistant specializing in answering questions about Streamdown, a drop-in replacement for react-markdown, designed for AI-powered streaming.";

export const translations = {
  en: {
    displayName: "English",
  },
};

export const basePath: string | undefined = undefined;

export const siteId: string | undefined = "streamdown"