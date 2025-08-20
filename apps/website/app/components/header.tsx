import type { SVGProps } from 'react';
import { Installer } from './installer';

const Vercel = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    viewBox="0 0 76 65"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>Vercel</title>
    <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor" />
  </svg>
);

export const Header = () => (
  <div className="sticky top-0 z-10 flex items-center justify-between bg-secondary p-4 backdrop-blur-sm">
    <div className="mx-auto flex items-center gap-1 sm:mx-0">
      <a href="https://vercel.com" className="flex items-center gap-1">
        <Vercel className="h-4 w-auto" />
        <span className="font-semibold sm:text-lg">Vercel</span>
      </a>
      <div className="text-muted-foreground sm:text-lg">/</div>
      <div className="text-muted-foreground sm:text-lg">Streamdown</div>
    </div>
    <div className="hidden md:block">
      <Installer />
    </div>
  </div>
);
