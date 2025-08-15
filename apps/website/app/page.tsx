import { CodeBlocks } from './components/code-blocks';
import { Header } from './components/header';
import { Hero } from './components/hero';
import { RenderOptimizations } from './components/render-optimizations';
import { Styles } from './components/styles';
import { TerminatorParser } from './components/terminator-parser';

const Home = () => (
  <div className="container mx-auto space-y-24">
    <div>
      <Header />
      <Hero />
    </div>
    <Styles />
    <CodeBlocks />
    <TerminatorParser />
    <RenderOptimizations />
  </div>
);

export default Home;
