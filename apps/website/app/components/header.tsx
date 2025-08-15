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
  <div className="sticky top-0 z-10 flex items-center justify-between bg-background/90 p-4 backdrop-blur-sm">
    <div className="flex items-center gap-1">
      <Vercel className="h-4 w-auto" />
      <span className="font-medium">Vercel</span>
      <div className="text-muted-foreground">/</div>
      <div className="text-muted-foreground">Streamdown</div>
    </div>
    <Installer />
  </div>
);
