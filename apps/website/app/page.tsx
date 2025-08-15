import Link from 'next/link';
import type { SVGProps } from 'react';
import { Button } from '@/components/ui/button';
import { MarkdownExample } from './components/example-markdown';
import { StreamdownExample } from './components/example-streamdown';

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

const Home = () => (
  <div className="mx-auto min-h-screen max-w-4xl divide-y divide-border border-x">
    <div className="sticky top-0 z-10 bg-background/90 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Vercel className="h-4 w-auto" />
        <span className="font-medium text-sm">Vercel</span>
        <div className="text-muted-foreground text-sm">/</div>
        <div className="text-muted-foreground text-sm">Streamdown</div>
      </div>
    </div>
    <main className="space-y-4 px-4 py-8">
      <h1 className="font-semibold text-4xl tracking-tight">Streamdown</h1>
      <p>
        A drop-in replacement for react-markdown, designed for AI-powered
        streaming.
      </p>
      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href="https://npmjs.com/package/streamdown">
            Download on NPM
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="https://github.com/vercel/streamdown">Source code</Link>
        </Button>
      </div>
    </main>
    <div className="grid grid-cols-2 divide-x">
      <div>
        <div className="w-full bg-secondary p-4 text-center">
          With Streamdown
        </div>
        <div className="p-4">
          <StreamdownExample />
        </div>
      </div>
      <div>
        <div className="w-full bg-secondary p-4 text-center">
          With react-markdown
        </div>
        <div className="p-4">
          <MarkdownExample />
        </div>
      </div>
    </div>
  </div>
);

export default Home;
