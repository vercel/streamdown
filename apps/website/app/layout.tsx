import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: 'variable',
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: 'variable',
  display: 'swap',
});

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en">
    <body
      className={cn(
        geistSans.variable,
        geistMono.variable,
        'overflow-x-hidden font-sans antialiased sm:px-4'
      )}
    >
      {children}
      <Analytics />
    </body>
  </html>
);

export default RootLayout;
