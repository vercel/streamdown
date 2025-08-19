/** biome-ignore-all lint/suspicious/noArrayIndexKey: "required" */

import { cn } from '@/lib/utils';
import { Installer } from './installer';

const COLUMNS = 12;
const LAST_COLUMN = COLUMNS - 1;

export const Hero = () => (
  <section>
    <div className="hidden grid-cols-12 divide-x sm:grid">
      {new Array(COLUMNS).fill(0).map((_, index) => (
        <div
          className={cn('aspect-square', index === LAST_COLUMN && 'border-r-0')}
          key={index}
        />
      ))}
    </div>
    <div className="sm:grid sm:grid-cols-12 sm:divide-x">
      <div />
      <div className="col-span-10 space-y-4 px-4 py-16 text-center sm:border-y sm:px-8">
        <h1 className="font-semibold text-4xl leading-tight tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Streamdown
        </h1>
        <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground md:text-2xl">
          A drop-in replacement for react-markdown, designed for AI-powered
          streaming.
        </p>
        <div className="mx-auto flex w-fit flex-col items-center gap-8 pt-4">
          <Installer />
          <p className="text-muted-foreground text-sm">
            or install it directly with{' '}
            <code className="rounded-md bg-foreground/5 px-2 py-1 tracking-tight">
              npm i streamdown
            </code>
          </p>
        </div>
      </div>
      <div className="border-r-0" />
    </div>
    <div className="hidden grid-cols-12 divide-x sm:grid">
      {new Array(COLUMNS).fill(0).map((_, index) => (
        <div
          className={cn('aspect-square', index === LAST_COLUMN && 'border-l-0')}
          key={index}
        />
      ))}
    </div>
  </section>
);
