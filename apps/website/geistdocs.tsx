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
  owner: undefined as string | undefined,
  repo: undefined as string | undefined,
};

export const nav = [
  {
    label: "Docs",
    href: "/docs",
  },
  {
    label: "Source",
    href: "https://github.com/vercel/streamdown",
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
