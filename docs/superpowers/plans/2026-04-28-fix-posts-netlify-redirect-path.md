# Fix Posts Listing: netlify.toml Redirect Strips /api/ Prefix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `/posts` showing 10 broken cards (undefined slugs, empty titles, "Invalid Date") by correcting a one-character-class bug in the `netlify.toml` API redirect.

**Root Cause (verified):** `netlify.toml` redirects `/api/*` to `/.netlify/functions/server/:splat` — missing `/api/` in the target path. For `/api/posts`, Nitro receives path `/posts` (not `/api/posts`), finds no handler, issues a 301 to `/posts/`, which Netlify serves as the SPA `index.html`. `useLazyFetch` receives HTML; `data.value` is set to the HTML string; `[...htmlString]` spreads it into individual characters; the first 10 characters are rendered as "post" objects with undefined slug/title/date.

**Confirmed:** `curl http://localhost:3000/api/posts/` returns 81 correct posts locally. The function logic and bundled articles data are correct — only the redirect target is wrong.

**Architecture:** `netlify.toml` `[[redirects]]` rules are Netlify edge-level and apply to all HTTP requests including AJAX. `force = true` fires even if a static file exists. The fix adds `/api/` back into the redirect target so Nitro receives the full original path.

**Tech Stack:** Netlify, Nitro (Netlify preset), Nuxt 3

---

## Files to Change

| File | Action | Reason |
|------|--------|--------|
| `netlify.toml` | Modify line 15 | Fix redirect target — add missing `/api/` prefix |
| `public/api/posts.json` | Regenerate | Restore static fallback removed in commit 9dbfd45 |

---

### Task 1: Fix the netlify.toml redirect (one-line change)

**Files:**
- Modify: `netlify.toml`

- [ ] **Step 1: Apply the fix**

In `netlify.toml`, find:

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/server/:splat"
  status = 200
  force = true
```

Change `to` so it includes `/api/`:

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/server/api/:splat"
  status = 200
  force = true
```

- [ ] **Step 2: Verify**

```bash
grep "functions/server" netlify.toml
```

Expected — the target now includes `api/`:
```
  to = "/.netlify/functions/server/api/:splat"
```

- [ ] **Step 3: Commit**

```bash
git add netlify.toml
git commit -m "fix(netlify): add missing /api/ prefix in functions redirect target"
```

---

### Task 2: Regenerate public/api/posts.json (static fallback)

**Files:**
- Create/update: `public/api/posts.json`

This file was removed in commit `9dbfd45`. With the function now working correctly it is not strictly required, but it provides a zero-latency static fallback.

- [ ] **Step 1: Run the generator**

```bash
node scripts/generate-posts-json.js
```

Expected output:
```
Generated public/api/posts.json with 45 posts
Generated 45 individual post JSON files
```

- [ ] **Step 2: Spot-check**

```bash
node -e "
const d = require('./public/api/posts.json');
console.log('count:', d.length);
console.log('first slug:', d[0].slug);
console.log('first title:', d[0].title.slice(0,40));
console.log('first date:', d[0].created_at);
"
```

Expected — all fields non-empty, date is ISO-8601:
```
count: 45
first slug: <non-empty, no "undefined">
first title: <non-empty string>
first date: 2022-02-17T00:00:00.000Z
```

- [ ] **Step 3: Commit**

```bash
git add public/api/posts.json
git commit -m "chore(posts): restore public/api/posts.json static fallback (45 articles)"
```

---

### Task 3: Build check + smoke test + push

- [ ] **Step 1: Build**

```bash
yarn build 2>&1 | tail -15
```

Expected: `Nitro built in X ms` with no TypeScript errors.

- [ ] **Step 2: Smoke-test the dev server**

```bash
yarn dev &
sleep 6
curl -sL http://localhost:3000/api/posts | node -e "
const d = require('fs').readFileSync('/dev/stdin','utf8')
const posts = JSON.parse(d)
console.log('count:', posts.length)
console.log('first slug:', posts[0]?.slug)
console.log('first title:', posts[0]?.title?.slice(0,50))
console.log('first date:', posts[0]?.created_at)
"
kill %1
```

Expected:
```
count: 45   (or more if Notion is responding)
first slug: <non-empty, no "undefined">
first title: <non-empty string>
first date: <ISO-8601 string>
```

- [ ] **Step 3: Push**

```bash
git push origin main
```

Netlify triggers a new deploy. The posts page at `https://www.pwijaya.com/posts` should show correct articles within 2–3 minutes.

---

## What NOT to change

- `server/api/posts/index.ts` — the function logic is correct and already has the static import fallback
- `server/data/articlesData.ts` — already regenerated with all 45 articles
- `pages/posts/index.vue` — the component is correct
- `public/_redirects` — the CMS/news rules are correct (they already include `/api/` in their targets)

## Why previous fixes didn't work

Every previous fix this session modified `server/api/posts/index.ts`. The function logic was never the problem — the function never received the request at all. The redirect chain ended at the SPA `index.html` before Nitro could process the API call.

## How the broken symptom is produced (reference)

```
1. Browser: useLazyFetch('/api/posts')
2. Netlify edge: /api/posts → force redirect → /.netlify/functions/server/posts
3. Lambda/Nitro receives path /posts (not /api/posts) → no matching route
4. Nitro: 301 → /posts/ (trailing-slash normalisation)
5. Netlify: /posts/ matches /* → /index.html → SPA HTML returned with 200
6. useLazyFetch receives HTML string (200 OK, no JSON parse error thrown)
7. data.value = HTML string (truthy)
8. [...data.value] spreads HTML string into individual characters
9. visiblePosts = first 10 chars: '<', '!', 'D', 'O', 'C', 'T', 'Y', 'P', 'E', ' '
10. Rendered as post objects with no .slug / .title / .created_at → "undefined", empty, "Invalid Date"
```
