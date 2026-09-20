# AGENTS.md

Nuxt 3 SSR portfolio and blog for `https://www.pwijaya.com`, deployed to Netlify. Blog posts are Notion-driven with a Netlify Blobs cache. A built-in CMS and a Notion-backed about/projects surface sit alongside it.

## Source Of Truth

- Development repository: `/Users/pranawijaya/Desktop/nuxt-portfolio`, branch `main`.
- Production Mac host: `pranas-mac-mini.tailac8d09.ts.net`, repository `/Users/pranawijaya/nuxt-portfolio`. This host runs the legacy publishing launchd job and can lag behind `main`; check `git log` before assuming parity.
- Deploy target is Netlify with the Nitro `netlify` preset. Pages and server routes compile to Netlify Functions.
- Notion is the content source for published posts. Netlify Blobs is a cache, never a source of truth.
- The article generator that feeds this site lives in a different repository: `/Users/pranawijaya/JobAutomationApplied`. Read its `AGENTS.md` before changing anything about how posts are created. Do not edit that repository from here.

## Commands

```bash
yarn dev          # dev server at localhost:3000
yarn build        # SSR build (Netlify serverless)
yarn generate     # static generation (pregenerate clears .nuxt and .output first)
yarn preview      # preview production build locally
yarn start        # run the built server from .output
```

There is no test suite and no linter or formatter. The README mentions ESLint and Prettier, but neither is in `package.json`. Do not invent a lint or test script.

### Utility scripts

```bash
node scripts/generate-posts-json.js      # writes public/api/posts.json only
python3 scripts/optimize_images.py       # 85% quality, creates backups
python3 scripts/optimize_images.py --dry-run
node --env-file=.env scripts/daily-article.mjs --dry-run   # legacy generator, see warning below
```

`scripts/generate-posts-json.js` is vestigial. `public/_redirects` no longer routes any request to `public/api/posts.json`, so regenerating it changes nothing user-facing. Leave it alone unless you are deliberately restoring static serving.

## Environment Variables

Server-only, read through `runtimeConfig`:

```
NOTION_TOKEN        # Notion integration token, used for posts, sitemap, CMS import
JWT_SECRET          # CMS session signing, default: your-jwt-secret-here
CMS_PASSWORD        # CMS login, default: admin123
CRON_SECRET         # bearer token for POST /api/posts/invalidate
```

Public, exposed to the client through `runtimeConfig.public`:

```
BASE_URL
GITHUB_USERNAME
NOTION_TABLE_ID
NOTION_PORTFOLIO_PAGE_ID
DEV_NAME
DEV_DESCRIPTION
DEV_ROLE
DEV_GITHUB_LINK
DEV_TWITTER_LINK
DEV_LINKEDIN_LINK
DEV_LOGO
```

`NOTION_ABOUT_PAGE_ID` appears in older docs but is not referenced anywhere in the codebase. Do not add it back without a caller.

`CRON_SECRET` must match on the caller and on Netlify. A mismatch makes `/api/posts/invalidate` return 401 while looking correctly configured on both ends. This has already happened once.

## Post Data Flow

`server/api/posts/[slug].ts` resolves a single post through three tiers, in order:

1. **Netlify Blobs** (`server/utils/post-store.ts`). Entries carry an `expiresAt` and are treated as missing once stale. Per-post TTL is 300 seconds.
2. **Local JSON** in `server/data/articles/*.json`, matched on `slug` and requiring `published`. A hit is written back into the Blob cache.
3. **Notion**, querying the database for pages with `public = true`.

Tier 3 matching accepts an explicit `slug` rich-text property first, then falls back to `generateSlug(title)`. Explicit slugs exist because generated titles do not always round-trip to the slug that was already published. Never remove the explicit-slug branch.

If a Notion page body contains a `Source: <url>` paragraph, the content is fetched from that URL and prefixed with a safe source link. Otherwise the Notion blocks themselves are rendered. An empty result is a 404, and a failed source fetch is a 503.

`server/api/posts/index.ts` is a separate path. It reads a cached listing, otherwise `fetchNotionListing`, otherwise falls back to `server/data/articlesData.ts`. Listing TTL is 300 seconds. The listing cache key is `posts:listing` and is deleted whenever any single post is invalidated.

`server/data/articlesData.ts` is roughly 800 KB and is now only a fallback for the listing and the sitemap. Single-post reads do not use it.

## Content Hashing

`server/utils/article-blocks.ts` normalizes an article, builds a canonical payload, and computes `computed_content_hash`. The API returns both `content_hash` (as stored in Notion) and `computed_content_hash`.

These two values are not expected to match byte for byte. The canonical payload includes `linkedinCopy`, and the Notion database has no `linkedin_copy` property, so that field is empty on the read side. This is a known and deliberately deferred discrepancy. Do not "fix" it by dropping `linkedinCopy` from the canonical payload without checking the generator in `JobAutomationApplied`, which hashes the same structure on the write side.

## Routing And Redirects

`public/_redirects` currently sends every API path to the serverless function:

```
/api/cms/*   -> /.netlify/functions/server/api/cms/:splat   200
/api/news/*  -> /.netlify/functions/server/api/news/:splat  200
/api/*       -> /.netlify/functions/server/api/:splat       200
/*           -> /.netlify/functions/server/:splat           200
```

Order matters. Netlify Functions 2.0 with `path: "/*"` and `preferStatic: true` processes `_redirects` before `netlify.toml`, so any API path not matched before the `/*` fallback receives `index.html` instead of JSON.

The final `/*` rule routes pages through the server function rather than a static SPA shell. That is intentional: crawlers and social previews need server-rendered metadata.

**Do not create a `public/api/posts/` directory.** Netlify issues a 301 trailing-slash redirect for any path matching a directory name, bypassing every redirect rule. Nitro then receives `/api/posts/`, matches no route, and returns `index.html`.

`nuxt.config.ts` sets `netlify.toml: false` on the Nitro Netlify plugin so Nuxt does not generate a conflicting `netlify.toml`.

## Cache Invalidation

`POST /api/posts/invalidate` requires `Authorization: Bearer <CRON_SECRET>`, accepts `{ "slug": "..." }` matching `/^[a-z0-9-]+$/`, and deletes both the post entry and the listing key. It returns 401 on a secret mismatch and 400 on a malformed slug.

Because both caches expire after 300 seconds anyway, invalidation only matters when a change must appear immediately.

## SEO

`pages/posts/[slug].vue` sets `useSeoMeta`, an explicit canonical link, and a `BlogPosting` JSON-LD block, all keyed off `https://www.pwijaya.com/posts/<slug>`.

`server/routes/sitemap.xml.ts` builds the sitemap from the live Notion listing and falls back to published entries in `articlesData.ts`. Static paths are `/`, `/about`, `/projects`, and `/posts`.

The canonical host is `https://www.pwijaya.com`, hardcoded in both the sitemap and the post page. Changing domains means changing both.

## Security

`server/utils/content-security.ts` guards remote content: `isSafeRemoteUrl` gates which URLs may be fetched, `sanitizeRemoteHtml` strips fetched HTML, and `buildSafeSourceLink` renders attribution. Tier 3 fetches arbitrary URLs taken from Notion page content, so these checks are the SSRF and injection boundary. Do not bypass them.

`renderRichText` in `server/api/posts/[slug].ts` escapes all Notion text and only emits an anchor when the href matches `^https?://`.

The CMS at `/cms/*` is protected by `middleware/cms-auth.ts` reading a `cms-token` cookie. `server/api/cms/auth/login.post.ts` validates `CMS_PASSWORD` and issues a 24-hour JWT signed with `JWT_SECRET`. Both have insecure defaults and must be set in production.

## Known Conflict: Duplicate Publishing

Two independent pipelines currently publish to this site at the same times.

- `scripts/daily-article.mjs`, run by launchd job `com.pwijaya.daily-article` on the Mac mini at 05:30 and 17:30 WIB. It writes to Notion and posts to LinkedIn directly, with no review step.
- The `content-review` pipeline in `JobAutomationApplied`, launchd job `com.pwijaya.content-review`, on the same 05:30 and 17:30 schedule. It routes drafts through a Discord review queue with a 15 minute auto-approval window.

As of 2026-09-21 both jobs are loaded on the Mac mini. `com.pwijaya.daily-article` ran at 05:30 and published to Notion and LinkedIn (`urn:li:share:7507567231271059456`). The content-review job last exited non-zero.

The legacy generator bypasses the review queue entirely and does not enforce the current content style policy. An earlier state entry shows it emitting `#softwareengineering #ai #career`, which violates the rule requiring 6 to 9 specific hashtags with no generic `#AI` tag.

Do not treat `scripts/daily-article.mjs` as the supported path, and do not extend it. Retiring it is an operator decision that has not been made yet.

## Other Surfaces

- **Portfolio projects**: hardcoded in `server/data/portfolioData.ts`, not Notion-driven. Images resolve through `utils/imageHelper.ts` to `.webp` variants under `public/images/portfolio/`.
- **Notion pages**: `/about` and `/page/[id]` render through `vue3-notion` and `notion-client`. `composables/useProps.ts` rewires internal Notion links to Nuxt routes. `server/api/page/[pageId].ts` fetches live.
- **News**: `server/api/news/{sync,enrich,backfill-covers}.post.ts` plus `scripts/backfill-notion-covers.mjs`. The Notion database must expose a url property named `source_url` or `Source URL`. Notion per-request timeout is 12 seconds; 4 seconds was too low.
- **CMS**: articles can be created and edited at `/cms/articles` and imported via `server/api/cms/import-notion.post.ts`.

## Styling

Tailwind CSS v3 with `@tailwindcss/typography`. Dark and light mode via `@nuxtjs/color-mode` with class-based switching (`classSuffix: ''`). PostCSS runs `postcss-nested` and `postcss-preset-env` with nesting-rules disabled to avoid conflicting with Tailwind nesting.

Blog media is width-constrained for mobile. Article content is explicitly contained to prevent horizontal overflow. Verify both at narrow widths before changing post layout.

## Conventions

- TypeScript throughout. Server utilities live in `server/utils/`, API routes in `server/api/`.
- Cache helpers swallow errors and degrade gracefully, because there is no Netlify Blobs context in local dev. Preserve that behavior.
- Fail closed on content: a missing or unfetchable article returns 404 or 503 rather than rendering an empty page.
- Do not commit `.env`, `NOTION_TOKEN`, `JWT_SECRET`, `CMS_PASSWORD`, or `CRON_SECRET`.
