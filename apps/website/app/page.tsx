import type { Metadata } from 'next';
import { CodeBlocks } from './components/code-blocks';
import { CallToAction } from './components/cta';
import { Footer } from './components/footer';
import { GitHubFlavoredMarkdown } from './components/gfm';
import { HardenedMarkdown } from './components/hardened';
import { Header } from './components/header';
import { Hero } from './components/hero';
import { Implementation } from './components/implementation';
import { Mathematics } from './components/mathematics';
import { Props } from './components/props';
import { Styles } from './components/styles';
import { TerminatorParser } from './components/terminator-parser';

export const metadata: Metadata = {
  title: 'Streamdown',
  description:
    'A drop-in replacement for react-markdown, designed for AI-powered streaming.',
};

const Home = () => (
  <div className="container mx-auto max-w-5xl divide-y px-0 sm:border-x">
    <Header />
    <Hero />
    <Implementation />
    <Styles />
    <GitHubFlavoredMarkdown />
    <CodeBlocks />
    <Mathematics />
    <TerminatorParser />
    <HardenedMarkdown />
    <Props />
    <CallToAction />
    <Footer />
  </div>
);

export default Home;
