# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # dev server at localhost:3000
yarn build        # SSR build (Netlify serverless)
yarn generate     # static site generation (clears .nuxt and .output first)
yarn preview      # preview production build locally
```

No test suite is configured. No linter/formatter is configured either (README mentions Eslint & Prettier but they are not present in package.json).

### Utility scripts

```bash
# After adding/editing articles in server/data/articles/, regenerate static JSON for Netlify:
node scripts/generate-posts-json.js

# Optimize images in public/images/portfolio/:
python3 scripts/optimize_images.py          # default 85% quality, creates backups
python3 scripts/optimize_images.py --dry-run
python3 scripts/optimize_images.py --quality 90 --no-backup
```

## Environment variables

Copy to `.env`:

```
BASE_URL=
GITHUB_USERNAME=
NOTION_TABLE_ID=
NOTION_ABOUT_PAGE_ID=
NOTION_PORTFOLIO_PAGE_ID=
NOTION_TOKEN=               # server-only, used by CMS import
JWT_SECRET=                 # server-only, default: your-jwt-secret-here
CMS_PASSWORD=               # server-only, default: admin123
DEV_NAME=
DEV_DESCRIPTION=
DEV_ROLE=
DEV_GITHUB_LINK=
DEV_TWITTER_LINK=
DEV_LINKEDIN_LINK=
DEV_LOGO=
```

## Architecture

The app is a Nuxt 3 SPA (`ssr: false`) deployed to Netlify. Nitro preset is `netlify` which compiles server routes to Netlify Functions.

### Data flow — blog posts

Both dev and production route through the same Nitro function:

- `server/api/posts/index.ts` and `server/api/posts/[slug].ts` read from `server/data/articlesData.ts`.
- `netlify.toml` force-redirects `/api/*` → the Netlify Function so all API routes go through Nitro.
- `public/api/posts.json` exists as a generated snapshot but is NOT in the active redirect chain.
- **Do NOT create a `public/api/posts/` directory.** Netlify infrastructure issues a 301 trailing-slash redirect for any path that matches a directory name, which fires before the `netlify.toml` force-redirect and causes Nitro to receive `/api/posts/` (no matching route) and return `index.html` instead of JSON.
- `scripts/generate-posts-json.js` only writes `public/api/posts.json`; it no longer writes individual per-post files.

When adding or editing a post, update the JSON files under `server/data/articles/`, then run `node scripts/generate-posts-json.js` to regenerate the `public/api/` static files.

### CMS

The built-in CMS lives at `/cms/*`. It is protected by `middleware/cms-auth.ts` (checks a `cms-token` cookie). Authentication is handled by `server/api/cms/auth/login.post.ts` which validates against `CMS_PASSWORD` and issues a 24-hour JWT signed with `JWT_SECRET`. Articles can be created/edited via `/cms/articles` and imported from a Notion database via `server/api/cms/import-notion.post.ts`.

### Portfolio projects

Project data is hardcoded in `server/data/portfolioData.ts` (not Notion-driven). Images are referenced via `utils/imageHelper.ts` → `getOptimizedImagePath()`, which resolves to `.webp` variants in `public/images/portfolio/`.

### Notion rendering

The `about` page and individual Notion pages (`/page/[id]`) use `vue3-notion` + `notion-client` to render Notion blocks. The `composables/useProps.ts` helper wires up internal Nuxt Link routing for Notion page links. The `server/api/page/[pageId].ts` route fetches live from Notion using `notion-client`.

### Routing / redirects

`netlify.toml` and `public/_redirects` both define redirect rules. The order matters:
- `/api/cms/*` → Netlify Functions (must come before SPA fallback)
- `/api/posts` and `/api/posts/:slug` → static JSON files
- `/*` → `/index.html` (SPA fallback, must be last)

The `nuxt.config.ts` sets `netlify.toml: false` on the Nitro Netlify plugin to avoid Nuxt generating a conflicting `netlify.toml`.

### Styling

Tailwind CSS v3 with `@tailwindcss/typography`. Dark/light mode via `@nuxtjs/color-mode` with class-based switching (`classSuffix: ''`). PostCSS pipeline includes `postcss-nested` and `postcss-preset-env` (nesting-rules disabled to avoid conflict with Tailwind nesting).
