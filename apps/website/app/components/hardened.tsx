import { Renderer } from './renderer';

const markdown = `
Here are some links to potentially malicious sites (please don't actually click them):

- [Click here for a free iPhone](http://malicious-site.com)
- [Get rich quick!](http://phishing.example)
- [Download suspicious file](http://dangerous-downloads.net)
- [Fake login page](http://fake-login.com)
`;

export const HardenedMarkdown = () => (
  <section className="space-y-16 pt-16">
    <div className="mx-auto max-w-2xl space-y-4 text-center">
      <h2 className="font-semibold text-4xl tracking-tight">
        Built-in security hardening
      </h2>
      <p className="text-balance text-lg text-muted-foreground md:text-xl">
        Streamdown ensures that untrusted markdown does not contain images from
        and links to unexpected origins which might have been{' '}
        <a
          className="font-medium text-blue-600 underline"
          href="https://vercel.com/blog/building-secure-ai-agents"
          rel="noreferrer"
          target="_blank"
        >
          subject to prompt injection
        </a>
        .
      </p>
    </div>
    <div className="grid grid-cols-2 divide-x overflow-hidden border-t">
      <div className="divide-y">
        <div className="w-full bg-dashed p-4 text-center font-medium text-muted-foreground text-sm">
          With react-markdown
        </div>
        <div className="h-[400px] overflow-y-auto bg-background p-4">
          <Renderer markdown={markdown} type="markdown" />
        </div>
      </div>
      <div className="divide-y">
        <div className="w-full bg-dashed p-4 text-center font-medium text-muted-foreground text-sm">
          With Streamdown
        </div>
        <div className="h-[400px] overflow-y-auto bg-background p-4">
          <Renderer
            markdown={markdown}
            streamdownProps={{
              defaultOrigin: 'https://streamdown.vercel.app',
              allowedLinkPrefixes: ['https://streamdown.vercel.app'],
            }}
            type="streamdown"
          />
        </div>
      </div>
    </div>
  </section>
);
