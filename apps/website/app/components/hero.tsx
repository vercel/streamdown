import { cn } from '@/lib/utils';
import { Installer } from './installer';

const COLUMNS = 12;
const LAST_COLUMN = COLUMNS - 1;

export const Hero = () => (
  <section className="grid grid-cols-12 divide-x divide-border">
    {new Array(COLUMNS).fill(0).map((_, index) => (
      <div
        className={cn('aspect-square', index === LAST_COLUMN && 'border-r-0')}
        key={index}
      />
    ))}
    <div />
    <div className="col-span-10 space-y-4 border-y p-16 text-center">
      <h1 className="font-semibold text-6xl leading-tight tracking-tighter md:text-7xl">
        Streamdown
      </h1>
      <p className="max-w-2xl text-balance text-lg text-muted-foreground md:text-2xl">
        A drop-in replacement for react-markdown, designed for AI-powered
        streaming.
      </p>
      <div className="mx-auto w-fit pt-4">
        <Installer />
      </div>
    </div>
    <div className="border-r-0" />
    {new Array(COLUMNS).fill(0).map((_, index) => (
      <div
        className={cn('aspect-square', index === LAST_COLUMN && 'border-l-0')}
        key={index}
      />
    ))}
  </section>
);
