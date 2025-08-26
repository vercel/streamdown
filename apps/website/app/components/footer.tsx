import { ModeToggle } from '@/components/mode-toggle';

export const Footer = () => (
  <footer className="px-4 py-8">
    <div className="flex items-center justify-between">
      <div className="flex-1 text-center text-muted-foreground text-sm">
        <p>
          Made with 🖤 and 🤖 by{' '}
          <a
            className="font-medium text-blue-600 underline"
            href="https://vercel.com"
            rel="noopener"
            target="_blank"
          >
            Vercel
          </a>
          . View the{' '}
          <a
            className="font-medium text-blue-600 underline"
            href="https://github.com/vercel/streamdown"
            rel="noopener"
            target="_blank"
          >
            source code
          </a>
          .
        </p>
      </div>
      <ModeToggle />
    </div>
  </footer>
);
