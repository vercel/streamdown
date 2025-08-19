/** biome-ignore-all lint/suspicious/noArrayIndexKey: "required" */

import { cn } from '@/lib/utils';
import { Installer } from './installer';

const COLUMNS = 12;
const LAST_COLUMN = COLUMNS - 1;

export const CallToAction = () => (
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
      <div className="col-span-10 space-y-4 border-y px-4 py-16 text-center sm:px-8">
        <h1 className="font-semibold text-xl leading-tight tracking-tighter sm:text-2xl md:text-3xl">
          Upgrade your AI-powered streaming
        </h1>
        <p className="mx-auto max-w-2xl text-balance text-muted-foreground sm:text-lg md:text-xl">
          Try Streamdown today and take your AI-powered streaming to the next
          level.
        </p>
        <div className="mx-auto w-fit pt-4">
          <Installer />
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
