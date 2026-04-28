# Fix Posts Listing: Static Fallback Not Bundled in Netlify Function

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the posts listing page which shows undefined slugs, empty titles, and "Invalid Date" in production by replacing the runtime `fs.readdir()` fallback with a build-time TypeScript import that Nitro bundles into the Netlify Function.

**Architecture:** `server/api/posts/index.ts` queries Notion first; if Notion returns nothing it falls back to local articles. The current fallback uses `fs.readdir()` at runtime, but Nitro/esbuild does NOT bundle `server/data/articles/*.json` into the Lambda bundle — `fs.readdir` throws ENOENT and the catch silently swallows it, returning `[]`. `server/data/articlesData.ts` already exists as a static TypeScript module and IS compiled into the bundle by Nitro. Importing it directly at build time guarantees the data is always available. A second bug: the early `return []` on line 9 (when `NOTION_TOKEN`/`NOTION_TABLE_ID` env vars are absent) also bypasses the fallback. Both are fixed here.

**Tech Stack:** Nuxt 3, Nitro (Netlify preset), Node.js

---

## Files to Change

| File | Action | Reason |
|------|--------|--------|
| `scripts/generate-articles-ts.js` | Create | Regenerates `articlesData.ts` from all 45 JSON files |
| `server/data/articlesData.ts` | Regenerate | Currently has 11 articles; needs all 45 |
| `server/api/posts/index.ts` | Modify | Replace `fs.readdir` with static import; remove early `return []` |

---

### Task 1: Regenerate `articlesData.ts` with all 45 articles

**Files:**
- Create: `scripts/generate-articles-ts.js`
- Regenerate: `server/data/articlesData.ts`

- [ ] **Step 1: Create the generation script**

Create `scripts/generate-articles-ts.js`:

```js
const fs = require('fs')
const path = require('path')

const ARTICLES_DIR = path.join(__dirname, '../server/data/articles')
const OUTPUT = path.join(__dirname, '../server/data/articlesData.ts')

const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.json'))
const articles = files.map(f => JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf-8')))

const content = `// Auto-generated file — run scripts/generate-articles-ts.js to update\nexport const articles = ${JSON.stringify(articles, null, 2)}\n`
fs.writeFileSync(OUTPUT, content)
console.log(`Generated articlesData.ts with ${articles.length} articles`)
```

- [ ] **Step 2: Run the script**

```bash
node scripts/generate-articles-ts.js
```

Expected output:
```
Generated articlesData.ts with 45 articles
```

- [ ] **Step 3: Verify**

```bash
grep -c '"published": true' server/data/articlesData.ts
```

Expected: `45`

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-articles-ts.js server/data/articlesData.ts
git commit -m "chore(posts): regenerate articlesData.ts with all 45 articles"
```

---

### Task 2: Fix `server/api/posts/index.ts` — static import, no early return

**Files:**
- Modify: `server/api/posts/index.ts`

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `server/api/posts/index.ts` with:

```ts
import { generateSlug } from '../../utils/slug'
import { articles as localArticles } from '../data/articlesData'

const NOTION_API = 'https://api.notion.com/v1'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const notionToken = config.notionToken
  const dbId = config.public.notionTableId

  const posts: Array<{
    slug: string
    title: string
    description: string
    created_at: string
    tags: string[]
    thumbnail: Array<{ url: string }> | null
  }> = []

  if (notionToken && dbId) {
    let cursor: string | undefined
    do {
      const body: Record<string, unknown> = {
        page_size: 100,
        filter: { property: 'public', checkbox: { equals: true } },
        sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      }
      if (cursor) body.start_cursor = cursor

      const res = await fetch(`${NOTION_API}/databases/${dbId}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) break

      const data: {
        results: Array<{
          id: string
          created_time: string
          cover?: { external?: { url: string }; file?: { url: string } }
          properties: Record<string, {
            type: string
            title?: Array<{ plain_text: string }>
            rich_text?: Array<{ plain_text: string }>
            multi_select?: Array<{ name: string }>
            date?: { start: string }
          }>
        }>
        has_more: boolean
        next_cursor: string | null
      } = await res.json()

      for (const page of data.results ?? []) {
        const props = page.properties
        const titleProp = props.title ?? props.Name ?? props.name
        const title = titleProp?.title?.[0]?.plain_text ?? ''
        if (!title) continue

        const slug = generateSlug(title)
        const description = props.description?.rich_text?.[0]?.plain_text ?? ''
        const tags = props.tags?.multi_select?.map(t => t.name) ?? []
        const createdAt = props.created_at?.date?.start ?? page.created_time
        const coverUrl = page.cover?.external?.url || page.cover?.file?.url || null

        posts.push({
          slug,
          title,
          description,
          created_at: new Date(createdAt).toISOString(),
          tags,
          thumbnail: coverUrl ? [{ url: coverUrl }] : null,
        })
      }

      cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined
    } while (cursor)
  }

  // Fallback: use bundled static articles when Notion returns nothing
  if (posts.length === 0) {
    for (const a of localArticles) {
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
  }

  return posts
})
```

Key changes:
- Top-level `import { articles as localArticles } from '../data/articlesData'` — bundled by Nitro at build time
- `if (!notionToken || !dbId) return []` REMOVED — replaced with `if (notionToken && dbId) { ... }` so the fallback always runs when Notion is unavailable
- `fs.readdir()` / dynamic `import('fs')` REMOVED entirely

- [ ] **Step 2: Verify the import is present**

```bash
grep "articlesData" server/api/posts/index.ts
```

Expected:
```
import { articles as localArticles } from '../data/articlesData'
```

- [ ] **Step 3: Verify the early return is gone**

```bash
grep "return \[\]" server/api/posts/index.ts
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add server/api/posts/index.ts
git commit -m "fix(posts): use bundled articlesData import instead of runtime fs.readdir fallback"
```

---

### Task 3: Build check + smoke test + push

- [ ] **Step 1: Build**

```bash
yarn build 2>&1 | tail -15
```

Expected: `Done in X.XXs.` with no TypeScript errors. If you see `Cannot find module '../data/articlesData'`, check that the import path in `server/api/posts/index.ts` is exactly `'../data/articlesData'` (two levels up from `server/api/posts/`).

- [ ] **Step 2: Smoke-test the API locally**

```bash
yarn dev &
sleep 5
curl -s http://localhost:3000/api/posts | node -e "
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
count: 45
first slug: <non-empty string, no "undefined">
first title: <non-empty string>
first date: <ISO-8601 string, e.g. 2022-02-17T00:00:00.000Z>
```

- [ ] **Step 3: Push**

```bash
git push origin main
```

---

## Out of Scope

- Replacing the expired S3 signed URLs in `featuredImage` fields (thumbnails fall back to `/logo.png` via `handleImageError` in `Blogs.vue`)
- Syncing Notion articles back into `articlesData.ts` — that is the CMS import flow
- Changing the Notion query structure

## Why the Previous Fix (`e297223`) Didn't Work

That fix added a `try/catch` around `fs.readdir()` at runtime. In Netlify Functions:
- `process.cwd()` is not the project root — it resolves to something like `/var/task/`
- `server/data/articles/` was never copied into the Lambda by Nitro/esbuild
- `fs.readdir` throws ENOENT, silently caught, returns `[]`

`import { articles } from '../data/articlesData'` is resolved at build time by Nitro/esbuild and the data is inlined into the function bundle — no filesystem access needed at runtime.
