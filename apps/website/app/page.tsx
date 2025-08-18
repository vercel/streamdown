import type { Metadata } from 'next';
import { CodeBlocks } from './components/code-blocks';
import { DeltaSmoothing } from './components/delta-smoothing';
import { GitHubFlavoredMarkdown } from './components/gfm';
import { HardenedMarkdown } from './components/hardened';
import { Header } from './components/header';
import { Hero } from './components/hero';
import { Styles } from './components/styles';
import { TerminatorParser } from './components/terminator-parser';

export const metadata: Metadata = {
  title: 'Streamdown',
  description:
    'A drop-in replacement for react-markdown, designed for AI-powered streaming.',
};

const Home = () => (
  <div className="container mx-auto max-w-5xl divide-y divide-border border-x px-0 pb-16">
    <Header />
    <Hero />
    <Styles />
    <GitHubFlavoredMarkdown />
    <CodeBlocks />
    <TerminatorParser />
    <HardenedMarkdown />
    <DeltaSmoothing />
  </div>
);

export default Home;
