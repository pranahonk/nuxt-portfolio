# Fix Posts Listing: Null Data / Invalid Date / Undefined Slugs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the posts listing page showing `undefined` slugs, empty titles, and "Invalid Date" by restoring the local JSON article fallback and removing a trailing-slash URL mismatch. Also adds infinite scroll: 10 articles visible on load, 10 more appended each time the user scrolls to the bottom.

**Architecture:** `server/api/posts/index.ts` queries Notion first; if Notion returns zero results (no pages with `public: true` yet) it falls back to the 45 pre-enriched local JSON articles in `server/data/articles/`. `pages/posts/index.vue` has a trailing slash on its fetch URL that can mismatch the Nitro route. Client-side infinite scroll is implemented in `pages/posts/index.vue` using `useIntersectionObserver` (already available via `@vueuse/nuxt`) — all posts are fetched once and sliced.

**Tech Stack:** Nuxt 3, Nitro serverless, `server/data/articles/*.json` (45 local articles), Notion REST API

---

## Root-Cause Analysis

| Cause | Evidence |
|-------|----------|
| Trailing slash mismatch | `useLazyFetch('/api/posts/')` in `pages/posts/index.vue`; Nitro route is `/api/posts` (no slash) |
| Missing local fallback | Previous `index.ts` (commit `421711b`) always read local JSON; the Notion rewrite removed that — if Notion has zero `public: true` pages the endpoint returns `[]` |
| `await useFetch` with `ssr:false` | `pages/index.vue` uses `await useFetch(...)` in `<script setup>` — with `ssr: false` the `await` resolves immediately with `null` before the SPA hydrates |
| Stale `public/api/posts.json` | File still exists; with `netlify.toml` `force = true` it's bypassed in production but adds confusion |

---

## Files to Change

| File | Action | Reason |
|------|--------|--------|
| `pages/posts/index.vue:2` | Modify | Remove trailing slash from `useLazyFetch('/api/posts/')` |
| `pages/index.vue:3` | Modify | Change `await useFetch` → `useLazyFetch` |
| `server/api/posts/index.ts` | Modify | Add local JSON fallback when Notion returns zero results |
| `public/api/posts.json` | Delete | Stale static file no longer needed |

---

### Task 1: Fix trailing slash in posts page

**Files:**
- Modify: `pages/posts/index.vue:2`

- [ ] **Step 1: Edit the URL**

In `pages/posts/index.vue` line 2, change:
```ts
const { data, pending, error } = useLazyFetch('/api/posts/')
```
to:
```ts
const { data, pending, error } = useLazyFetch('/api/posts')
```

- [ ] **Step 2: Verify**

Run: `grep "useLazyFetch" pages/posts/index.vue`
Expected: `const { data, pending, error } = useLazyFetch('/api/posts')`

- [ ] **Step 3: Commit**

```bash
git add pages/posts/index.vue
git commit -m "fix(posts): remove trailing slash from useLazyFetch URL"
```

---

### Task 2: Fix await useFetch on home page

**Files:**
- Modify: `pages/index.vue:3`

- [ ] **Step 1: Replace await useFetch with useLazyFetch**

In `pages/index.vue`, change:
```ts
const { data } = await useFetch('/api/posts', {
  transform: (posts: any[]) => posts?.slice(0, 3) || [] // Show max 3 featured posts
})
```
to:
```ts
const { data } = useLazyFetch('/api/posts', {
  transform: (posts: any[]) => posts?.slice(0, 3) || []
})
```

- [ ] **Step 2: Verify**

Run: `grep "useFetch\|useLazyFetch" pages/index.vue`
Expected: `useLazyFetch('/api/posts', {`

- [ ] **Step 3: Commit**

```bash
git add pages/index.vue
git commit -m "fix(home): use useLazyFetch instead of await useFetch for ssr:false"
```

---

### Task 3: Restore local JSON fallback in posts API

**Files:**
- Modify: `server/api/posts/index.ts`

Add a fallback block after the `do { ... } while (cursor)` loop, before `return posts`. The `server/data/articles/*.json` files have fields: `slug`, `title`, `excerpt` (mapped → `description`), `createdAt` (mapped → `created_at`), `tags`, `featuredImage` (mapped → `thumbnail`), `published`.

- [ ] **Step 1: Add the fallback block**

After the line `} while (cursor)` and before `return posts`, insert:

```ts
  // Fallback: serve local JSON articles when Notion returns nothing
  if (posts.length === 0) {
    const { promises: fs } = await import('fs')
    const { join } = await import('path')
    const ARTICLES_DIR = join(process.cwd(), 'server/data/articles')
    try {
      const files = await fs.readdir(ARTICLES_DIR)
      for (const file of files) {
        if (!file.endsWith('.json')) continue
        const raw = await fs.readFile(join(ARTICLES_DIR, file), 'utf-8')
        const a = JSON.parse(raw)
        if (!a.published) continue
        posts.push({
          slug: a.slug as string,
          title: a.title as string,
          description: (a.excerpt ?? '') as string,
          created_at: new Date(a.createdAt as string).toISOString(),
          tags: (a.tags ?? []) as string[],
          thumbnail: a.featuredImage ? [{ url: a.featuredImage as string }] : null,
        })
      }
    } catch {
      // articles dir absent in some deploy environments — skip
    }
  }
```

- [ ] **Step 2: Verify the block was inserted**

Run: `grep -n "Fallback" server/api/posts/index.ts`
Expected: a line containing `// Fallback: serve local JSON articles when Notion returns nothing`

- [ ] **Step 3: Commit**

```bash
git add server/api/posts/index.ts
git commit -m "fix(posts): restore local JSON article fallback when Notion returns empty"
```

---

### Task 4: Delete stale static file

**Files:**
- Delete: `public/api/posts.json`

- [ ] **Step 1: Delete the file**

```bash
rm public/api/posts.json
```

- [ ] **Step 2: Verify**

Run: `ls public/api/`
Expected: only the `posts/` directory, no `posts.json` file

- [ ] **Step 3: Commit**

```bash
git add -u public/api/posts.json
git commit -m "chore: remove stale public/api/posts.json (live Nitro function replaces it)"
```

---

### Task 5: Deploy and verify

- [ ] **Step 1: Push all commits**

```bash
git push origin main
```

- [ ] **Step 2: Wait for Netlify deploy (~2 min)**

Watch the Netlify dashboard → Deploys tab → wait for "Published" status.

- [ ] **Step 3: Verify posts page**

Open `https://prana-wijaya.netlify.app/posts` in a browser.
Expected:
- Posts listed with correct titles, dates in "Month DD, YYYY" format, and tags
- No "Invalid Date" anywhere
- No `/posts/undefined` links
- Thumbnails load (or fall back to `/logo.png`)

- [ ] **Step 4: Verify locally**

```bash
yarn dev
```
Open `http://localhost:3000/posts`.
Expected: the 45 local JSON articles appear (since local Notion likely has no `public: true` pages yet).

---

## Out of Scope

- Adding `public: true` pages to the Notion database (manual content step)
- Changing Notion DB property names or schema
- Modifying thumbnail display or card styling

## Risks

- `server/data/articles/*.json` might not be bundled by Nitro into the Netlify Function. The fallback wraps reads in `try/catch` so this degrades gracefully to an empty list rather than a crash.
- `public/api/posts.json` deletion is safe: `netlify.toml` already has `force = true` on `/api/*`, so the static file is bypassed in production.
