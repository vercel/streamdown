# Streamdown Docs Website

The documentation and marketing site for [Streamdown](https://streamdown.ai), built on [Geistdocs](https://github.com/vercel/geistdocs) — Vercel's package-backed docs system powered by Next.js and [Fumadocs](https://fumadocs.dev).

The shared runtime (layout, docs renderer, search, Ask AI, markdown routes, proxy behavior, and MDX components) is provided by [`@vercel/geistdocs`](https://www.npmjs.com/package/@vercel/geistdocs). This app owns its content, configuration, and thin adapter files.

## Structure

- `content/docs/` - Documentation pages (MDX). Sidebar order is controlled by `content/docs/meta.json`.
- `geistdocs.tsx` - Site configuration (logo, nav, GitHub links, AI prompt and suggestions, agent metadata).
- `lib/geistdocs/` - Source and config adapters wiring the app to `@vercel/geistdocs`.
- `components/geistdocs/` - User-owned adapters for MDX components, the provider, and the docs layout.
- `app/[lang]/(home)/` - The marketing landing page.
- `app/[lang]/playground/` - The interactive Streamdown playground.
- `app/[lang]/docs/` - Docs routes rendered by `createDocsPage` from the package.
- `proxy.ts` - Markdown content negotiation (`.md`/`.mdx` URLs, `Accept: text/markdown`) and i18n handling via `createProxy`.

## AI-readable output

The site serves machine-readable surfaces from package route helpers:

- `/llms.txt` - Full documentation corpus as markdown
- `/sitemap.md` - Markdown sitemap with page summaries
- `/agents.md` - Agent-readiness metadata
- Any docs page with a `.md`/`.mdx` suffix - Per-page markdown

## Development

From the repository root:

```bash
pnpm install
pnpm dev --filter website
```

The site consumes the workspace `streamdown` and `@streamdown/*` packages directly, so live demos always render against the local source.

## Updating Geistdocs

```bash
npx @vercel/geistdocs update
```

This bumps the `@vercel/geistdocs` dependency. Local adapter files are user-owned and never overwritten.

## Environment variables

- `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` - Production URL used for absolute links (set automatically on Vercel)
- `AI_GATEWAY_API_KEY` - Enables the Ask AI assistant (set automatically on Vercel)
