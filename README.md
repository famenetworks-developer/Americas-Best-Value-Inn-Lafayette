# Americas Best Value Inn Lafayette

React 19 + TypeScript + Vite. Five statically rendered hotel pages with React hydration: Home, Rooms, Amenities, Location and Gallery. Source is in `src/`; hotel facts and room options are centralized in `src/data.ts`. Custom CSS follows the supplied reference's navy rail navigation, cream and sand sections, brass accents, serif headings, rectangular buttons and spacious layouts.

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

The build type-checks TypeScript, bundles assets, renders every route into its own HTML file, and generates a custom 404, robots.txt and five-route sitemap.xml. Development mode is for editing; use the production build for SEO checks.

## Public launch configuration

Copy `.env.example` to `.env.local`, set `SITE_URL` to the real HTTPS origin, and set `PUBLIC_INDEXING=true` only when publishing publicly. Build again. Canonical, social image URLs, structured data, sitemap and robots are generated from this configuration. Private Sites publication intentionally uses `noindex` and disallows crawling.

Set account-issued `GOOGLE_SITE_VERIFICATION` and/or `BING_SITE_VERIFICATION` values if using HTML verification. Search Console and Bing account verification and sitemap submission have not been performed. Verify the public origin in those accounts and submit `/sitemap.xml` after launch. Link the actual public URL from the authorized Google Business Profile. Google Hotels inventory/feed participation is a separate business integration, not something schema alone supplies.

No GA4 tracker is enabled. Add the owner's real measurement ID and an appropriate consent implementation before enabling analytics; update the visible privacy notice accordingly. No reservation or payment details are collected here. Booking links open the actual Sonesta property page; dates and availability are selected there, without assuming undocumented booking query parameters.

Serve `dist/` as a static website. Configure the host to return `404.html` with an actual HTTP 404 for unknown paths, rather than rewriting all paths to the homepage. There are no renamed legacy pages requiring redirects. Set HTTPS and the preferred domain redirect in the final host's domain settings.

## Assets and content

The official Sonesta logo is paired with real property photographs from the supplied hotel listings. Room photographs are presented as listing photography, with a visible note that exact layouts and assignments must be confirmed during booking. Fonts are locally hosted. See `RESEARCH.md` for evidence and source conflicts.

## Verification

`npm test` checks built HTML, local assets, internal anchors, booking destinations, image alternatives/dimensions, schema consistency and private-preview indexing. Tests expect the default private preview configuration; adjust the indexing assertion when deliberately releasing a public build.

The completed page was visually inspected in the local VS Code browser at desktop width, including the hero, fixed rail and long-page sections. Lighthouse, Google Rich Results Test and Schema.org's online validator remain external launch checks; no scores or successful external validation are claimed.
