import {
  CommandPromptContent,
  CommandPromptCopy,
  CommandPromptList,
  CommandPromptPrefix,
  CommandPromptRoot,
  CommandPromptSurface,
  CommandPromptTrigger,
  CommandPromptTriggerDivider,
  CommandPromptViewport,
} from "@vercel/geistdocs/components/command-prompt";
import DynamicLink from "fumadocs-core/dynamic-link";
import type { Metadata } from "next";
import { CenteredSection } from "./components/centered-section";
import { CTA } from "./components/cta";
import { Demo } from "./components/demo";
import { Hero } from "./components/hero";
import { OneTwoSection } from "./components/one-two-section";
import { Templates } from "./components/templates";
import { TextGridSection } from "./components/text-grid-section";
import { Usage } from "./components/usage";
import AiElements from "./images/ai-elements.png";
import NextjsChatbotTemplate from "./images/nextjs-chatbot-template.png";
import VibeCodingPlatform from "./images/vibe-coding-platform.png";

const title = "Streamdown";
const description =
  "A markdown renderer designed for streaming content from AI models. Highly interactive, customizable, and easy to use.";

const COMMAND_FOR_HUMANS = "npm i streamdown";
const COMMAND_FOR_AGENTS = "npx skills add vercel/streamdown@streamdown";

export const metadata: Metadata = {
  title,
  description,
};

const templates = [
  {
    title: "Next.js Chatbot Template",
    description:
      "A free, open-source template that helps you dive right into building powerful chatbot applications.",
    link: "https://github.com/vercel/ai-chatbot",
    image: NextjsChatbotTemplate,
  },
  {
    title: "AI Elements",
    description:
      "A collection of UI elements for building AI-powered applications.",
    link: "https://elements.ai-sdk.dev/",
    image: AiElements,
  },
  {
    title: "Vibe Coding Platform",
    description: "An end to end text-to-app coding platform.",
    link: "https://oss-vibe-coding-platform.vercel.app/",
    image: VibeCodingPlatform,
  },
];

const Link = DynamicLink;

const features = [
  {
    id: "typography",
    title: "Typography & GFM",
    description: (
      <>
        Built-in <Link href="/[lang]/docs/typography">Tailwind typography</Link>{" "}
        for headings, lists, and code blocks.{" "}
        <Link href="/[lang]/docs/gfm">GitHub Flavored Markdown</Link> adds
        tables, task lists, strikethrough, and autolinks.
      </>
    ),
  },
  {
    id: "streaming",
    title: "Streaming experience",
    description: (
      <>
        Built-in <Link href="/[lang]/docs/carets">caret indicators</Link> show
        users content is generating.{" "}
        <Link href="/[lang]/docs/termination">Unterminated block styling</Link>{" "}
        parses incomplete Markdown for prettier streaming with smooth{" "}
        <Link href="/[lang]/docs/animation">animations</Link>.
      </>
    ),
  },
  {
    id: "code",
    title: "Interactive code blocks",
    description: (
      <>
        <Link href="/[lang]/docs/plugins/code">Shiki-powered</Link> syntax
        highlighting with{" "}
        <Link href="/[lang]/docs/interactivity">copy and download buttons</Link>
        . Supports language detection and line numbers.
      </>
    ),
  },
  {
    id: "plugins",
    title: "Math, diagrams & CJK",
    description: (
      <>
        <Link href="/[lang]/docs/plugins/math">LaTeX math</Link> through KaTeX,
        interactive{" "}
        <Link href="/[lang]/docs/plugins/mermaid">Mermaid diagrams</Link> with
        fullscreen viewing, and{" "}
        <Link href="/[lang]/docs/plugins/cjk">CJK support</Link> for correct
        ideographic punctuation.
      </>
    ),
  },
  {
    id: "security",
    title: "Security & link safety",
    description: (
      <>
        <Link href="/[lang]/docs/security">Security hardening</Link> blocks
        images and links from unexpected origins.{" "}
        <Link href="/[lang]/docs/link-safety">Link safety modals</Link> display
        the full URL before navigation to protect users.
      </>
    ),
  },
  {
    id: "customization",
    title: "Fully customizable",
    description: (
      <>
        Override any element with{" "}
        <Link href="/[lang]/docs/components">custom components</Link>, apply
        your own <Link href="/[lang]/docs/styling">styles</Link>, and fine-tune
        behavior through{" "}
        <Link href="/[lang]/docs/configuration">configuration</Link>.
        Tree-shakeable <Link href="/[lang]/docs/plugins">plugins</Link> keep
        your bundle lean.
      </>
    ),
  },
];

const HomePage = () => (
  <div className="container mx-auto max-w-5xl">
    <Hero description={description} title={title}>
      <div className="mx-auto flex w-full flex-col items-center gap-6">
        <CommandPromptRoot defaultValue="humans">
          <CommandPromptList>
            <CommandPromptTrigger className="min-w-[90px]" value="humans">
              For humans
            </CommandPromptTrigger>
            <CommandPromptTriggerDivider />
            <CommandPromptTrigger className="min-w-[84px]" value="agents">
              For agents
            </CommandPromptTrigger>
          </CommandPromptList>
          <CommandPromptSurface>
            <CommandPromptPrefix>$</CommandPromptPrefix>
            <CommandPromptViewport>
              <CommandPromptContent
                copyValue={COMMAND_FOR_HUMANS}
                value="humans"
              >
                {COMMAND_FOR_HUMANS}
              </CommandPromptContent>
              <CommandPromptContent
                copyValue={COMMAND_FOR_AGENTS}
                value="agents"
              >
                {COMMAND_FOR_AGENTS}
              </CommandPromptContent>
            </CommandPromptViewport>
            <CommandPromptCopy />
          </CommandPromptSurface>
        </CommandPromptRoot>
      </div>
    </Hero>
    <div className="grid">
      <CenteredSection
        description="Built-in typography, streaming carets, animations, plugins, and more."
        title="A fully-loaded Markdown renderer"
      >
        <Demo />
      </CenteredSection>
      <TextGridSection data={features} />
      <OneTwoSection
        description="Install only what you need. Plugins are optional and tree-shakeable for minimal bundle size."
        title="Get started in seconds"
      >
        <Usage />
      </OneTwoSection>
      <Templates
        data={templates}
        description="See Streamdown in action with one of our templates."
        title="Showcase"
      />
      <CTA
        cta="Read the docs"
        href="/docs"
        title="Upgrade your AI experiences"
      />
    </div>
  </div>
);

export default HomePage;
