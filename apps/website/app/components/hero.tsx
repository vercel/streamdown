import { Installer } from './installer';

export const Hero = () => (
  <section className="flex flex-col items-center justify-center space-y-4 rounded-3xl bg-secondary px-4 py-20 text-center">
    <h1 className="font-semibold text-6xl leading-tight tracking-tighter md:text-7xl">
      Streamdown
    </h1>
    <p className="max-w-2xl text-balance text-lg text-muted-foreground md:text-2xl">
      A drop-in replacement for react-markdown, designed for AI-powered
      streaming.
    </p>
    <div className="pt-4">
      <Installer />
    </div>
  </section>
);
