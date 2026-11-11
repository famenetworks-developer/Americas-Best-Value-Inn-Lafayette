# Americas Best Value Inn Lafayette

React 19 + TypeScript + Vite. One substantive, statically rendered hotel page with React hydration. Source is in `src/`; hotel facts and room options are centralized in `src/data.ts`. Custom CSS follows the supplied reference's navy rail navigation, cream and sand sections, brass accents, serif headings, rectangular buttons and spacious layouts.

## Run locally

```sh
npm ci
npm run dev
```

For the crawlable production version:

```sh
npm run build
npm test
npm run preview
```

The build type-checks TypeScript, bundles assets, renders the entire React page into HTML, and generates a custom 404, robots.txt and sitemap.xml. Development mode is for editing; use the production build for SEO checks.

## Public launch configuration

Copy `.env.example` to `.env.local`, set `SITE_URL` to the real HTTPS origin, and set `PUBLIC_INDEXING=true` only when publishing publicly. Build again. Canonical, social image URLs, structured data, sitemap and robots are generated from this configuration. Private Sites publication intentionally uses `noindex` and disallows crawling.

Set account-issued `GOOGLE_SITE_VERIFICATION` and/or `BING_SITE_VERIFICATION` values if using HTML verification. Search Console and Bing account verification and sitemap submission have not been performed. Verify the public origin in those accounts and submit `/sitemap.xml` after launch. Link the actual public URL from the authorized Google Business Profile. Google Hotels inventory/feed participation is a separate business integration, not something schema alone supplies.

No GA4 tracker is enabled. Add the owner's real measurement ID and an appropriate consent implementation before enabling analytics; update the visible privacy notice accordingly. No reservation or payment details are collected here. Booking links open the actual Sonesta property page; dates and availability are selected there, without assuming undocumented booking query parameters.

Serve `dist/` as a static website. Configure the host to return `404.html` with an actual HTTP 404 for unknown paths, rather than rewriting all paths to the homepage. There are no renamed legacy pages requiring redirects. Set HTTPS and the preferred domain redirect in the final host's domain settings.

## Assets and content

Only official Sonesta logo and property photography are used, as requested. Fonts are locally hosted; photos are WebP with dimensions and a smaller gallery variant. See `RESEARCH.md` for evidence, source conflicts and unavailable photography. Do not add a room photo until both its permission and room mapping are established.

## Verification

`npm test` checks built HTML, local assets, internal anchors, booking destinations, image alternatives/dimensions, schema consistency and private-preview indexing. Tests expect the default private preview configuration; adjust the indexing assertion when deliberately releasing a public build.

The automation browser host was unavailable in this environment. Therefore browser interaction, visual comparison at device widths, console inspection, Lighthouse, Google Rich Results Test and Schema.org's online validator still require a browser QA pass. No scores or successful external validation are claimed.
