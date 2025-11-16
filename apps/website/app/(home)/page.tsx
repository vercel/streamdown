import type { Metadata } from "next";
import { CodeBlocks } from "./components/code-blocks";
import { CallToAction } from "./components/cta";
import { FAQ } from "./components/faq";
import { Footer } from "./components/footer";
import { GitHubFlavoredMarkdown } from "./components/gfm";
import { HardenedMarkdown } from "./components/hardened";
import { Hero } from "./components/hero";
import { Mathematics } from "./components/mathematics";
import { MermaidDemo } from "./components/mermaid";
import { Styles } from "./components/styles";
import { TerminatorParser } from "./components/terminator-parser";

export const metadata: Metadata = {
  title: "Streamdown",
  description:
    "A drop-in replacement for react-markdown, designed for AI-powered streaming.",
};

const Home = () => (
  <div className="overflow-x-hidden bg-sidebar sm:px-4">
    <div className="container mx-auto max-w-6xl divide-y px-0 sm:border-x">
      <Hero />
      <Styles />
      <GitHubFlavoredMarkdown />
      <CodeBlocks />
      <Mathematics />
      <MermaidDemo />
      <TerminatorParser />
      <HardenedMarkdown />
      <CallToAction />
      <FAQ />
      <Footer />
    </div>
  </div>
);

export default Home;
