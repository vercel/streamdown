import type { Metadata } from "next";
import { CJKLanguageSupport } from "./components/cjk";
import { CodeBlocks } from "./components/code-blocks";
import { Caret } from "./components/caret";
import { CallToAction } from "./components/cta";
import { GitHubFlavoredMarkdown } from "./components/gfm";
import { HardenedMarkdown } from "./components/hardened";
import { Hero } from "./components/hero";
import { Logos } from "./components/logos";
import { Mathematics } from "./components/mathematics";
import { MermaidDemo } from "./components/mermaid";
import { Styles } from "./components/styles";
import { TerminatorParser } from "./components/terminator-parser";
import { Usage } from "./components/usage";

export const metadata: Metadata = {
  title: "Streamdown",
  description:
    "A drop-in replacement for react-markdown, designed for AI-powered streaming.",
};

const Home = () => (
  <div className="sm:px-4">
    <div className="container mx-auto max-w-6xl divide-y border-b px-0 sm:border-x">
      <Hero />
      <Logos />
      <Usage />
      <Styles />
      <Caret />
      <GitHubFlavoredMarkdown />
      <CJKLanguageSupport />
      <CodeBlocks />
      <Mathematics />
      <MermaidDemo />
      <TerminatorParser />
      <HardenedMarkdown />
      <CallToAction />
    </div>
  </div>
);

export default Home;
