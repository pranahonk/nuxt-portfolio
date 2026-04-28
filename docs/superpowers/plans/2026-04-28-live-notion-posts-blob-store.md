# Live Notion Posts + Netlify Blob Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Articles toggled to `public: true` in Notion automatically appear on pwijaya.com/posts with full content — no manual import, no redeploy after initial setup.

**Architecture:** The posts API routes are currently bypassed by static-JSON redirects in `public/_redirects`. Removing those two lines exposes the Nitro server functions already wired up in `netlify.toml`'s `/api/*` catch-all. The detail API uses a three-tier lookup: Netlify Blob Storage (fast, persistent) → local JSON (45 existing articles) → on-demand Notion + source URL fetch (new articles). During news sync, Dev.to articles are enriched immediately (one extra API call per new article); HN articles are enriched lazily on first visit.

**Tech Stack:** `@netlify/blobs`, `@mozilla/readability`, `linkedom`, Notion REST API, Dev.to REST API, Nuxt 3 Nitro server routes.

---

## File Map

| File | Change | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add `@netlify/blobs`; move readability + linkedom to `dependencies` |
| `server/utils/slug.ts` | Create | Shared `generateSlug()` — single source of truth |
| `server/utils/content-fetcher.ts` | Create | Fetch full article HTML from Dev.to API or Readability |
| `server/utils/post-store.ts` | Create | Netlify Blob Storage get/set wrapper with graceful fallback |
| `server/api/posts/index.ts` | Rewrite | Live Notion query filtered by `public: true` |
| `server/api/posts/[slug].ts` | Rewrite | Blob → local JSON → on-demand enrichment pipeline |
| `server/api/news/sync.post.ts` | Modify | Enrich Dev.to articles + set Notion cover + store in blob |
| `public/_redirects` | Modify | Remove 2 static-JSON lines so `netlify.toml` catch-all takes over |

No changes needed to `netlify.toml` — the existing `/api/*` redirect and `Cache-Control: public, max-age=60` headers already handle posts correctly.

---

## Task 1: Install dependencies

**Files:** `package.json`

- [ ] **Step 1: Install `@netlify/blobs`**

```bash
cd /Users/pranawijaya/Desktop/nuxt-portfolio && yarn add @netlify/blobs
```

Expected: `@netlify/blobs` appears in `dependencies`.

- [ ] **Step 2: Move readability + linkedom from devDependencies to dependencies**

In `package.json`, move these two entries from `devDependencies` into `dependencies`:
```json
"@mozilla/readability": "^0.6.0",
"linkedom": "^0.18.12",
```

- [ ] **Step 3: Reinstall**

```bash
yarn install
```

- [ ] **Step 4: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: add @netlify/blobs, promote readability+linkedom to dependencies"
```

---

## Task 2: Create `server/utils/slug.ts`

**Files:** Create `server/utils/slug.ts`

- [ ] **Step 1: Create the file**

```ts
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
```

- [ ] **Step 2: Build check**

```bash
cd /Users/pranawijaya/Desktop/nuxt-portfolio && yarn build 2>&1 | tail -10
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add server/utils/slug.ts
git commit -m "feat: extract generateSlug into shared server utility"
```

---

## Task 3: Create `server/utils/content-fetcher.ts`

**Files:** Create `server/utils/content-fetcher.ts`

- [ ] **Step 1: Create the file**

```ts
import { Readability } from '@mozilla/readability'
import { parseHTML } from 'linkedom'

export interface EnrichedContent {
  content: string
  thumbnail: string
  excerpt: string
}

async function fetchDevToContent(url: string): Promise<EnrichedContent | null> {
  const match = url.match(/dev\.to\/([^/]+)\/([^/?#]+)/)
  if (!match) return null
  const [, username, slug] = match
  try {
    const res = await fetch(`https://dev.to/api/articles/${username}/${slug}`, {
      headers: { 'User-Agent': 'prana-portfolio/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.body_html || (data.body_html as string).replace(/<[^>]+>/g, '').trim().length < 200) return null
    return {
      content: data.body_html as string,
      thumbnail: (data.cover_image || data.social_image || '') as string,
      excerpt: (data.description || '') as string,
    }
  } catch {
    return null
  }
}

async function fetchReadabilityContent(url: string): Promise<EnrichedContent | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; portfolio-fetcher/1.0)' },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const { document } = parseHTML(html)
    const reader = new Readability(document as unknown as Document)
    const article = reader.parse()
    if (!article?.content || article.content.replace(/<[^>]+>/g, '').trim().length < 200) return null
    return {
      content: article.content,
      thumbnail: '',
      excerpt: article.excerpt || '',
    }
  } catch {
    return null
  }
}

export async function fetchContentFromUrl(url: string): Promise<EnrichedContent | null> {
  if (url.includes('dev.to/')) {
    const result = await fetchDevToContent(url)
    if (result) return result
  }
  return fetchReadabilityContent(url)
}
```

- [ ] **Step 2: Build check**

```bash
yarn build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add server/utils/content-fetcher.ts
git commit -m "feat: add content-fetcher utility (Dev.to API + Readability fallback)"
```

---

## Task 4: Create `server/utils/post-store.ts`

**Files:** Create `server/utils/post-store.ts`

- [ ] **Step 1: Create the file**

```ts
import { getStore } from '@netlify/blobs'

export interface StoredPost {
  slug: string
  title: string
  content: string
  thumbnail: string
  excerpt: string
  created_at: string
  tags: string[]
}

function openStore() {
  return getStore({ name: 'posts', consistency: 'strong' })
}

export async function getCachedPost(slug: string): Promise<StoredPost | null> {
  try {
    const store = openStore()
    const raw = await store.get(slug)
    if (!raw) return null
    return JSON.parse(raw) as StoredPost
  } catch {
    return null
  }
}

export async function setCachedPost(slug: string, post: StoredPost): Promise<void> {
  try {
    const store = openStore()
    await store.set(slug, JSON.stringify(post))
  } catch {
    // No Netlify context in local dev — graceful degradation
  }
}
```

- [ ] **Step 2: Build check**

```bash
yarn build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add server/utils/post-store.ts
git commit -m "feat: add post-store utility wrapping Netlify Blob Storage"
```

---

## Task 5: Rewrite `server/api/posts/index.ts`

**Files:** Modify `server/api/posts/index.ts`

- [ ] **Step 1: Replace the entire file**

```ts
import { generateSlug } from '../utils/slug'

const NOTION_API = 'https://api.notion.com/v1'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const notionToken = config.notionToken
  const dbId = config.public.notionTableId
  if (!notionToken || !dbId) return []

  const posts: Array<{
    slug: string
    title: string
    description: string
    created_at: string
    tags: string[]
    thumbnail: Array<{ url: string }> | null
  }> = []

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

  return posts
})
```

- [ ] **Step 2: Build check**

```bash
yarn build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add server/api/posts/index.ts
git commit -m "feat: rewrite posts index API to query Notion live"
```

---

## Task 6: Rewrite `server/api/posts/[slug].ts`

**Files:** Modify `server/api/posts/[slug].ts`

- [ ] **Step 1: Replace the entire file**

```ts
import { promises as fs } from 'fs'
import { join } from 'path'
import { generateSlug } from '../utils/slug'
import { getCachedPost, setCachedPost } from '../utils/post-store'
import { fetchContentFromUrl } from '../utils/content-fetcher'

const ARTICLES_DIR = join(process.cwd(), 'server/data/articles')
const NOTION_API = 'https://api.notion.com/v1'

function toResponse(post: {
  slug: string; title: string; content: string; thumbnail: string
  excerpt: string; created_at: string; tags: string[]
}) {
  return {
    slug: post.slug,
    title: post.title,
    content: post.content,
    description: post.excerpt,
    created_at: post.created_at,
    updated_at: post.created_at,
    tags: post.tags,
    thumbnail: post.thumbnail ? [{ url: post.thumbnail }] : null,
  }
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const config = useRuntimeConfig()

  // Tier 1: Netlify Blob Storage
  const cached = await getCachedPost(slug)
  if (cached) return toResponse(cached)

  // Tier 2: Local JSON files (45 pre-enriched articles)
  try {
    const files = await fs.readdir(ARTICLES_DIR)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const raw = await fs.readFile(join(ARTICLES_DIR, file), 'utf-8')
      const article = JSON.parse(raw)
      if (article.slug !== slug || !article.published) continue
      const stored = {
        slug: article.slug as string,
        title: article.title as string,
        content: article.content as string,
        thumbnail: (article.featuredImage ?? '') as string,
        excerpt: (article.excerpt ?? '') as string,
        created_at: new Date(article.createdAt as string).toISOString(),
        tags: (article.tags ?? []) as string[],
      }
      await setCachedPost(slug, stored)
      return toResponse(stored)
    }
  } catch {
    // ARTICLES_DIR may not exist in production — fall through
  }

  // Tier 3: Query Notion + fetch source URL on-demand
  const notionToken = config.notionToken
  const dbId = config.public.notionTableId
  if (!notionToken || !dbId) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }

  let matchedPage: Record<string, unknown> | null = null
  let matchedTitle = ''
  let cursor: string | undefined

  do {
    const body: Record<string, unknown> = {
      page_size: 100,
      filter: { property: 'public', checkbox: { equals: true } },
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

    const data = await res.json() as {
      results: Array<Record<string, unknown>>
      has_more: boolean
      next_cursor: string | null
    }

    for (const page of data.results ?? []) {
      const props = page.properties as Record<string, { title?: Array<{ plain_text: string }> }>
      const titleProp = props.title ?? props.Name ?? props.name
      const title = titleProp?.title?.[0]?.plain_text ?? ''
      if (generateSlug(title) === slug) {
        matchedPage = page
        matchedTitle = title
        break
      }
    }

    if (matchedPage) break
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined
  } while (cursor)

  if (!matchedPage) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  // Extract source URL from Notion page blocks
  const blocksRes = await fetch(
    `${NOTION_API}/blocks/${matchedPage.id as string}/children?page_size=10`,
    { headers: { Authorization: `Bearer ${notionToken}`, 'Notion-Version': '2022-06-28' } }
  )

  let sourceUrl = ''
  if (blocksRes.ok) {
    const blocksData = await blocksRes.json() as {
      results: Array<{ type: string; paragraph?: { rich_text: Array<{ plain_text: string }> } }>
    }
    for (const block of blocksData.results ?? []) {
      if (block.type !== 'paragraph') continue
      const text = block.paragraph?.rich_text?.map(t => t.plain_text).join('') ?? ''
      const m = text.match(/Source: (https?:\/\/\S+)/)
      if (m) { sourceUrl = m[1]; break }
    }
  }

  if (!sourceUrl) throw createError({ statusCode: 404, statusMessage: 'Post content not available yet' })

  const enriched = await fetchContentFromUrl(sourceUrl)
  if (!enriched) throw createError({ statusCode: 503, statusMessage: 'Could not fetch article content' })

  const props = matchedPage.properties as Record<string, {
    rich_text?: Array<{ plain_text: string }>
    multi_select?: Array<{ name: string }>
    date?: { start: string }
  }>
  const cover = matchedPage.cover as { external?: { url: string }; file?: { url: string } } | null
  const description = props.description?.rich_text?.[0]?.plain_text ?? ''
  const tags = props.tags?.multi_select?.map(t => t.name) ?? []
  const createdAt = new Date(
    (props.created_at?.date?.start ?? matchedPage.created_time) as string
  ).toISOString()
  const thumbnail = cover?.external?.url || cover?.file?.url || enriched.thumbnail || ''
  const content =
    `<p><a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">🔗 Read original article</a></p>\n` +
    enriched.content

  const stored = {
    slug, title: matchedTitle, content, thumbnail,
    excerpt: enriched.excerpt || description,
    created_at: createdAt, tags,
  }
  await setCachedPost(slug, stored)
  return toResponse(stored)
})
```

- [ ] **Step 2: Build check**

```bash
yarn build 2>&1 | tail -10
```

- [ ] **Step 3: Test locally with existing slug**

```bash
curl "http://localhost:3000/api/posts/apa-arti-dua-tanda-tanya-pada-swift" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['title'], '-', len(d['content']), 'chars')"
```

Expected: title prints, content > 500 chars.

- [ ] **Step 4: Commit**

```bash
git add "server/api/posts/[slug].ts"
git commit -m "feat: rewrite posts detail API with blob→localJSON→on-demand pipeline"
```

---

## Task 7: Update news sync to enrich Dev.to articles

**Files:** Modify `server/api/news/sync.post.ts`

- [ ] **Step 1: Add three imports after the existing `import { Client }` line**

```ts
import { generateSlug } from '../utils/slug'
import { fetchContentFromUrl } from '../utils/content-fetcher'
import { setCachedPost } from '../utils/post-store'
```

- [ ] **Step 2: Add `thumbnail?: string` to the `Article` interface**

```ts
interface Article {
  title: string
  url: string
  description: string
  tags: string[]
  thumbnail?: string
}
```

- [ ] **Step 3: Replace `fetchDevTo` to capture `cover_image`**

```ts
async function fetchDevTo(): Promise<Article[]> {
  const TAGS = ['ai', 'javascript', 'programming']
  const results: Article[] = []
  for (const tag of TAGS) {
    const res = await fetch(
      `${DEVTO_API}/articles?tag=${tag}&per_page=5&top=7`,
      { headers: { 'User-Agent': 'prana-portfolio/newssync' } }
    )
    if (!res.ok) continue
    const articles: Array<{
      title: string; url: string; description?: string
      cover_image?: string; social_image?: string
    }> = await res.json()
    for (const a of articles) {
      results.push({
        title: a.title,
        url: a.url,
        description: a.description ?? '',
        tags: [tag, 'dev-to'],
        thumbnail: a.cover_image || a.social_image || '',
      })
    }
  }
  return results
}
```

- [ ] **Step 4: Replace `createNotionPage` to set page cover when thumbnail exists**

```ts
async function createNotionPage(notion: Client, dbId: string, article: Article): Promise<void> {
  await notion.pages.create({
    parent: { database_id: dbId },
    ...(article.thumbnail ? { cover: { external: { url: article.thumbnail } } } : {}),
    properties: {
      title: { title: [{ text: { content: article.title } }] },
      tags: { multi_select: article.tags.map(t => ({ name: t })) },
      description: { rich_text: [{ text: { content: article.description.slice(0, 2000) } }] },
      public: { checkbox: false },
      created_at: { date: { start: new Date().toISOString() } },
    },
    children: [
      {
        object: 'block' as const, type: 'paragraph' as const,
        paragraph: {
          rich_text: [
            { type: 'text' as const, text: { content: '🔗 Source: ' } },
            { type: 'text' as const, text: { content: article.url, link: { url: article.url } } },
          ],
        },
      },
      {
        object: 'block' as const, type: 'paragraph' as const,
        paragraph: { rich_text: [{ type: 'text' as const, text: { content: article.description } }] },
      },
    ],
  })
}
```

- [ ] **Step 5: Replace the per-article `try` block to enrich Dev.to articles after Notion create**

```ts
    try {
      await createNotionPage(notion, dbId, article)
      existingTitles.add(key)
      added++

      // Enrich Dev.to articles immediately — full content ready when user toggles public
      if (article.url.includes('dev.to/')) {
        const enriched = await fetchContentFromUrl(article.url)
        if (enriched) {
          const slug = generateSlug(article.title)
          await setCachedPost(slug, {
            slug,
            title: article.title,
            content:
              `<p><a href="${article.url}" target="_blank" rel="noopener noreferrer">🔗 Read original article</a></p>\n` +
              enriched.content,
            thumbnail: enriched.thumbnail || article.thumbnail || '',
            excerpt: enriched.excerpt || article.description,
            created_at: new Date().toISOString(),
            tags: article.tags,
          })
        }
      }

      await new Promise(r => setTimeout(r, 350))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`Notion create failed for "${article.title}":`, msg)
    }
```

- [ ] **Step 6: Build check**

```bash
yarn build 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add server/api/news/sync.post.ts
git commit -m "feat: enrich Dev.to articles at sync time, store in Blob Storage"
```

---

## Task 8: Remove static-JSON redirects from `_redirects`

**Files:** Modify `public/_redirects`

`netlify.toml` already has `/api/*  /.netlify/functions/server/:splat  200  force=true`. The static lines in `_redirects` match first and override it — removing them lets the catch-all route posts to the Nitro function.

- [ ] **Step 1: Remove the posts static lines**

Delete these three lines from `public/_redirects` (the comment and both redirect rules):
```
# Public posts API - serve static JSON files
/api/posts  /api/posts.json  200
/api/posts/:slug  /api/posts/:slug.json  200
```

The final file should be:
```
# CMS API routes - must use serverless functions
/api/cms/*  /.netlify/functions/server/api/cms/:splat  200

# News sync API
/api/news/*  /.netlify/functions/server/api/news/:splat  200

# SPA fallback for client-side routing - must be LAST
/*  /index.html  200
```

- [ ] **Step 2: Commit**

```bash
git add public/_redirects
git commit -m "feat: remove static posts JSON redirects — live API via netlify.toml catch-all"
```

---

## Task 9: Deploy and verify

- [ ] **Step 1: Push to main**

```bash
git push origin main
```

- [ ] **Step 2: Verify posts index returns live Notion data**

```bash
curl https://www.pwijaya.com/api/posts | python3 -m json.tool | head -40
```

Expected: JSON array with `slug`, `title`, `description`, `created_at`, `tags`, `thumbnail`.

- [ ] **Step 3: Verify existing post detail**

```bash
curl "https://www.pwijaya.com/api/posts/apa-arti-dua-tanda-tanya-pada-swift" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['title'], '-', len(d['content']), 'chars')"
```

Expected: title + content length > 500 chars.

- [ ] **Step 4: Test new-article flow**

In Notion (`f906db55...`), toggle any `public: false` article to `public: true`. Then (wait up to 60 s for CDN cache expiry):

```bash
curl https://www.pwijaya.com/api/posts \
  | python3 -c "import sys,json; [print(p['title']) for p in json.load(sys.stdin)]"
```

Expected: newly-toggled article title appears.

```bash
curl "https://www.pwijaya.com/api/posts/<derived-slug>" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['content'][:300])"
```

Expected: full article HTML — not a stub.

- [ ] **Step 5: Verify news sync still works**

```bash
curl -s -X POST https://www.pwijaya.com/api/news/sync \
  -H "Authorization: Bearer $(grep CRON_SECRET /Users/pranawijaya/Desktop/nuxt-portfolio/.env | cut -d= -f2 | tr -d '"')"
```

Expected: `{"added":N,"skipped":M,"total":K}`.

---

## Notes

- **Local dev**: Blob Storage requires `netlify dev`. Without it, blob ops silently no-op and the pipeline falls through to local JSON — correct for local development.
- **HN article thumbnails**: HN articles show `/logo.png` fallback in the index (no cover image at sync time). The detail page fetches and caches OG image on first visit but the index won't reflect it unless the Notion cover is manually set.
- **Cache TTL**: `/api/*` is cached for 60 s at the Netlify CDN edge. New articles may take up to 60 s to appear after toggling public.
- **Blob Storage limits**: Netlify free tier — 1 GB storage, ~20,000 articles at 50 KB each.
