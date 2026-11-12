# Vercel deployment

This project deploys the public Vite website and `/admin` from one Vercel project. The Go CMS runs as a Vercel Function under `/api`, and PostgreSQL is supplied by Neon through the Vercel Marketplace.

## 1. Push the project to GitHub

From the `hotel-site` directory, commit the project to a private GitHub repository. Do not commit `.env`, `.env.local`, database dumps, or production credentials.

## 2. Import it into Vercel

1. Sign in at <https://vercel.com> and select **Add New → Project**.
2. Import the GitHub repository.
3. If this repository contains the parent project folder, set **Root Directory** to `hotel-site`.
4. Framework preset: **Vite**.
5. Build command: `npm run build`.
6. Output directory: `dist`.
7. Do not deploy yet; configure storage and environment variables first.

## 3. Create PostgreSQL

1. In the Vercel project, open **Storage**.
2. Select **Create Database → Marketplace Database → Neon**.
3. Create the database in a region near the Vercel Function region.
4. Copy the injected pooled PostgreSQL URL. Add it as an environment variable named `DATABASE_URL` for Production, Preview, and Development. If Neon injected `POSTGRES_URL`, copy that value into `DATABASE_URL`.
5. The URL must use TLS in production, normally with `sslmode=require`.

The Go Function applies the idempotent schema migrations and default hotel content when it first connects.

## 4. Configure environment variables

In **Project Settings → Environment Variables**, add:

| Name | Production value |
|---|---|
| `DATABASE_URL` | Neon pooled PostgreSQL connection URL |
| `COOKIE_SECURE` | `true` |
| `ADMIN_EMAIL` | `admin` |
| `ADMIN_NAME` | `Site Administrator` |
| `ADMIN_PASSWORD` | `admin123` |
| `SITE_URL` | Your final `https://...vercel.app` or custom domain |
| `PUBLIC_INDEXING` | `false` until launch approval |

`admin123` is accepted because it was explicitly requested, but it is a weak internet-facing password. Replace it with a unique 16+ character password before sharing the URL. Bootstrap variables create the account only when it does not already exist; changing the variable later does not change an existing user's password.

## 5. Persistent media

Vercel Functions have an ephemeral filesystem, so do not use `MEDIA_DIR` for production uploads. Create a **public Vercel Blob** store from the Storage tab. Until the CMS upload endpoint is migrated to the Blob SDK, upload images in the Blob dashboard and paste the resulting public Blob URL into the CMS image field. Existing bundled hotel images continue to work normally.

Vercel documents a 4.5 MB Function request-body limit for server uploads. Direct Blob client uploads are recommended for larger media.

## 6. Deploy

Select **Deploy**. After deployment completes, verify:

```text
https://YOUR-PROJECT.vercel.app/
https://YOUR-PROJECT.vercel.app/admin/login
https://YOUR-PROJECT.vercel.app/api/health
```

Login initially with:

```text
Admin ID: admin
Password: admin123
```

## 7. Required verification

1. `/api/health` returns `{"ok":true}`.
2. `/admin/login` shows the green and ivory login screen.
3. Log in and edit a homepage field.
4. Save it as a draft and confirm the public page is unchanged.
5. Publish it and confirm the public page updates.
6. Restore the original copy.
7. Check Vercel **Logs** for Function or database errors.
8. Test desktop and mobile admin layouts.

## 8. Custom domain and indexing

Add the production domain under **Settings → Domains**. Set `SITE_URL` to that HTTPS domain and redeploy. Set `PUBLIC_INDEXING=true` only after content, canonical URLs, robots.txt, and sitemap are approved.

## Updating the site

Push changes to the connected production branch. Vercel automatically builds and deploys them. Content changes made through the admin panel are stored in Neon and do not require a code deployment.
