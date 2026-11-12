# Americas Best Value Inn Lafayette + CMS

React 19 + TypeScript + Vite. Five statically rendered hotel pages with React hydration: Home, Rooms, Amenities, Location and Gallery. Source is in `src/`; hotel facts and room options are centralized in `src/data.ts`. Custom CSS follows the supplied reference's navy rail navigation, cream and sand sections, brass accents, serif headings, rectangular buttons and spacious layouts.

The integrated CMS uses Go 1.24+ and PostgreSQL 17. It provides secure administrator sessions, role-based access, drafts and publishing, revisions, audited changes, media uploads, property settings, and public theme/content delivery. The premium dashboard is available at `/admin`.

## Run locally

```sh
npm ci
npm run build
docker compose up -d postgres
```

Create the first administrator without storing a password in source control. In PowerShell:

```powershell
$env:ADMIN_EMAIL="you@example.com"
$env:ADMIN_NAME="Site Administrator"
$env:ADMIN_PASSWORD="use-a-random-password-at-least-12-characters"
npm run dev:api
```

In another terminal:

```sh
npm run dev
```

Open `http://localhost:8080/admin`. The frontend dev server proxies `/api` and `/uploads` to the Go service on port 18082. Database migrations and the existing-site seed are applied idempotently when the API starts. After the first account is created, remove `ADMIN_PASSWORD` from the environment; startup never overwrites an existing account.

Local PostgreSQL uses host port `55432` to avoid common local PostgreSQL ports. Override `DATABASE_URL` for an existing or managed PostgreSQL service.

For the crawlable production version:

```sh
npm run build
npm test
npm run preview
```

`npm test` runs the existing route/accessibility/SEO tests and Go security/validation tests. `npm run build` type-checks React, bundles and prerenders the public site, and compiles the Go server to `dist/server.exe`.

## CMS workflow and roles

- **Super Admin** can manage content, publishing, settings, and users.
- **Editor** can create, edit, upload, and publish.
- **Author** can create and edit drafts but cannot publish.

Published public content is returned by `GET /api/public/content`; draft fields and administration metadata are never included. Saving a draft does not alter the public site. Publishing atomically copies the draft into the public version. Each save creates a revision and important actions are recorded in the activity log.

Authentication uses bcrypt password hashes, random opaque HTTP-only SameSite cookies, rotating CSRF tokens, server-side sessions, a five-attempt login throttle, request-size limits, role authorization, strict JSON decoding, and validated media types/slugs/theme colors. Set `COOKIE_SECURE=true` behind production HTTPS.

## Environment

Copy `.env.example` to a secure, uncommitted environment file or configure the deployment platform directly. Important values:

- `DATABASE_URL`: PostgreSQL connection string.
- `APP_ADDR`: Go listen address; defaults to `:18082`.
- `MEDIA_DIR`: persistent uploaded-media directory.
- `COOKIE_SECURE`: must be `true` on HTTPS production deployments.
- `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD`: one-time bootstrap values.
- `SITE_URL` and `PUBLIC_INDEXING`: public SEO origin and indexing switch.

Do not commit `.env`, credentials, database dumps, or uploaded guest/private material.

## Production deployment

For a complete Vercel + Neon deployment, follow [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

1. Provision PostgreSQL 15+ and persistent object/disk storage for `MEDIA_DIR`.
2. Set a restricted database user, a private `DATABASE_URL`, and `COOKIE_SECURE=true`.
3. Run the compiled server from the project root (or package `dist` and the media directory together). Migrations run during startup.
4. Put the Go service behind an HTTPS reverse proxy and route the site, `/api`, and `/uploads` to the same origin.
5. Bootstrap the first administrator once, then remove the bootstrap password.
6. Set `PUBLIC_INDEXING=true` only after the production hostname and content are approved.

For horizontal deployment, replace disk media with object storage through the media service boundary. Apply CDN caching to published assets/public GET responses and purge it after publish.

## Media and backups

Uploads accept JPG, PNG, WebP, and AVIF up to 10 MB, use server-generated storage keys, and cannot escape `MEDIA_DIR`. Keep the media directory persistent and excluded from source control.

Back up PostgreSQL daily with `pg_dump` (encrypted and retained off-host), and back up media storage on the same schedule. Regularly test a restore into a non-production database. Before schema upgrades, take an additional database snapshot and preserve the matching media snapshot.

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
