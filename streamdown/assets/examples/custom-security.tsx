'use client';

import { Streamdown, defaultRehypePlugins } from 'streamdown';
import { code } from '@streamdown/code';

// Strict security config for AI-generated content
const rehypePlugins = [
  defaultRehypePlugins.raw,
  defaultRehypePlugins.sanitize,
  [defaultRehypePlugins.harden[0], {
    allowedProtocols: ['https', 'mailto'],
    allowedLinkPrefixes: ['https://your-domain.com', 'https://docs.your-domain.com'],
    allowedImagePrefixes: ['https://cdn.your-domain.com'],
    allowDataImages: false,
  }],
];

export default function SecureChat({ content }: { content: string }) {
  return (
    <Streamdown
      plugins={{ code }}
      rehypePlugins={rehypePlugins}
      linkSafety={{
        enabled: true,
        onLinkCheck: async (url) => {
          const trusted = ['your-domain.com'];
          const hostname = new URL(url).hostname;
          return trusted.some((d) => hostname.endsWith(d));
        },
      }}
    >
      {content}
    </Streamdown>
  );
}
