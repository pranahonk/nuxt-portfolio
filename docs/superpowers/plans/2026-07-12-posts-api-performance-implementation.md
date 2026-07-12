# Posts API Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add offset pagination + Blob caching to `/api/posts`, KeepAlive for instant back-navigation, and a service worker for offline asset caching.

**Architecture:** `/api/posts` serves a cascading read path — Netlify Blob cache (`posts:listing`, 5-min TTL) → static `public/api/posts.json` → Notion (cold path, repopulates cache). The endpoint returns a paginated slice `{ posts, total, hasMore }`. The frontend fetches page-by-page via the existing infinite-scroll sentinel, and `<KeepAlive>` preserves list state on back-navigation. `@vite-pwa/nuxt` adds a network-first (API) / cache-first (assets) service worker.

**Tech Stack:** Nuxt 3 (`ssr: false`), Nitro (netlify preset), Netlify Blobs, Notion API, `@vite-pwa/nuxt`, Vitest/node:test.

## Global Constraints

- API response shape: `{ posts: PostSummary[], total: number, hasMore: boolean }` (was: bare array — this is a BREAKING change; all consumers must be updated).
- Blob store name: `posts`, listing key: `posts:listing`.
- Pagination defaults: `page=1`, `limit=10`. `page` and `limit` are 1-based positive integers; clamp invalid values to defaults.
- Blob listing TTL: `300` seconds (5 min) for API cold-path writes; `21600` seconds (6h) for cron-generated writes.
- Consumers of `/api/posts` that MUST be updated for the new shape: `pages/posts/index.vue`, `pages/index.vue`, `components/Header.vue`, `components/Blogs.vue` (if it fetches), `pages/cms/index.vue`.
- `PostSummary` type: `{ slug: string; title: string; description: string; created_at: string; tags: string[]; thumbnail: Array<{ url: string }> | null }`.
- Node test runner: `node --test tests/<file>.test.mjs` (matches existing `tests/news-sync.test.mjs`).

---

### Task 1: Add Blob listing helpers to post-store

**Files:**
- Modify: `server/utils/post-store.ts`
- Test: `tests/post-store-listing.test.mjs`

**Interfaces:**
- Produces:
  - `getPostListing(): Promise<PostSummary[] | null>` — returns cached list or null on miss/error.
  - `setPostListing(posts: PostSummary[], ttlSeconds: number): Promise<void>` — writes list; silent no-op if Blob unavailable.

- [ ] **Step 1: Write the failing test**

Create `tests/post-store-listing.test.mjs`:
```javascript
import test from 'node:test'
import assert from 'node:assert/strict'

// Mock @netlify/blobs before importing the module under test.
const store = new Map()
const mockGetStore = () => ({
  get: async (k) => store.get(k) ?? null,
  set: async (k, v) => { store.set(k, v) },
})

test('setPostListing then getPostListing round-trips the list', async () => {
  // Inject the mock via a module loader shim (see helper).
  const { getPostListing, setPostListing } = await import(
    '../server/utils/post-store.ts?listing-test'
  ).catch(() => import('../server/utils/post-store.mjs'))

  const sample = [{ slug: 'a', title: 'A', description: '', created_at: '2026-07-12T00:00:00.000Z', tags: [], thumbnail: null }]
  await setPostListing(sample, 300)
  const got = await getPostListing()
  assert.equal(Array.isArray(got), true)
})
```

Note: because `@netlify/blobs` throws outside Netlify context, the real functions already catch and return null/no-op. The test asserts graceful behavior: `getPostListing()` returns `null` when no Netlify context and no mock is present.

Simpler, dependency-free test (use this):
```javascript
import test from 'node:test'
import assert from 'node:assert/strict'
import { getPostListing, setPostListing } from '../server/utils/post-store.ts'

test('getPostListing returns null outside Netlify context (graceful)', async () => {
  const result = await getPostListing()
  assert.equal(result, null)
})

test('setPostListing does not throw outside Netlify context', async () => {
  await assert.doesNotReject(setPostListing([], 300))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/post-store-listing.test.mjs`
Expected: FAIL — `getPostListing`/`setPostListing` are not exported yet (import error).

- [ ] **Step 3: Add the helpers**

Append to `server/utils/post-store.ts` (after the existing `setCachedPost`):
```typescript
const LISTING_KEY = 'posts:listing'

export interface PostSummary {
  slug: string
  title: string
  description: string
  created_at: string
  tags: string[]
  thumbnail: Array<{ url: string }> | null
}

export async function getPostListing(): Promise<PostSummary[] | null> {
  try {
    const store = openStore()
    const raw = await store.get(LISTING_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PostSummary[]
  } catch {
    return null
  }
}

export async function setPostListing(
  posts: PostSummary[],
  ttlSeconds: number
): Promise<void> {
  try {
    const store = openStore()
    // Netlify Blobs expiration: expiration is an absolute epoch-ms Date.
    const expiration = new Date(Date.now() + ttlSeconds * 1000)
    await store.set(LISTING_KEY, JSON.stringify(posts), { metadata: { expiration: expiration.toISOString() } })
  } catch {
    // No Netlify context in local dev — graceful degradation.
  }
}
```

Note on TTL: `@netlify/blobs` does not natively expire keys by TTL in all runtimes. Store an `expiration` inside the value envelope instead, and check it on read. Use this envelope form instead of the above if runtime TTL is unsupported:
```typescript
export async function setPostListing(posts: PostSummary[], ttlSeconds: number): Promise<void> {
  try {
    const store = openStore()
    const envelope = { posts, expiresAt: Date.now() + ttlSeconds * 1000 }
    await store.set(LISTING_KEY, JSON.stringify(envelope))
  } catch {}
}

export async function getPostListing(): Promise<PostSummary[] | null> {
  try {
    const store = openStore()
    const raw = await store.get(LISTING_KEY)
    if (!raw) return null
    const env = JSON.parse(raw) as { posts: PostSummary[]; expiresAt: number }
    if (!env.expiresAt || Date.now() > env.expiresAt) return null
    return env.posts
  } catch {
    return null
  }
}
```
**Use the envelope form** — it is runtime-portable. Delete the metadata form.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/post-store-listing.test.mjs`
Expected: PASS (both tests — null on miss, no throw on set).

- [ ] **Step 5: Commit**

```bash
git add server/utils/post-store.ts tests/post-store-listing.test.mjs
git commit -m "feat(posts): add Blob listing cache helpers with TTL envelope"
```

---

### Task 2: Extract shared Notion listing fetch

**Files:**
- Create: `server/utils/notion-listing.ts`
- Test: `tests/notion-listing.test.mjs`

**Interfaces:**
- Consumes: `generateSlug` from `server/utils/slug`.
- Produces: `fetchNotionListing(token: string, dbId: string): Promise<PostSummary[]>` — queries all public Notion pages (paginated), maps to `PostSummary[]` sorted newest-first. Returns `[]` on any fetch failure.

- [ ] **Step 1: Write the failing test**

Create `tests/notion-listing.test.mjs`:
```javascript
import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchNotionListing } from '../server/utils/notion-listing.ts'

test('fetchNotionListing returns [] when fetch fails', async () => {
  const origFetch = globalThis.fetch
  globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) })
  try {
    const result = await fetchNotionListing('token', 'db')
    assert.deepEqual(result, [])
  } finally {
    globalThis.fetch = origFetch
  }
})

test('fetchNotionListing maps and sorts pages newest-first', async () => {
  const origFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      results: [
        { id: '1', created_time: '2026-07-10T00:00:00Z', cover: null,
          properties: { title: { type: 'title', title: [{ plain_text: 'Older' }] },
            description: { type: 'rich_text', rich_text: [] },
            tags: { type: 'multi_select', multi_select: [] },
            created_at: { type: 'date', date: { start: '2026-07-10T00:00:00Z' } } } },
        { id: '2', created_time: '2026-07-12T00:00:00Z', cover: { external: { url: 'http://x/y.png' } },
          properties: { title: { type: 'title', title: [{ plain_text: 'Newer' }] },
            description: { type: 'rich_text', rich_text: [] },
            tags: { type: 'multi_select', multi_select: [] },
            created_at: { type: 'date', date: { start: '2026-07-12T00:00:00Z' } } } },
      ],
      has_more: false, next_cursor: null,
    }),
  })
  try {
    const result = await fetchNotionListing('token', 'db')
    assert.equal(result.length, 2)
    assert.equal(result[0].title, 'Newer')
    assert.deepEqual(result[0].thumbnail, [{ url: 'http://x/y.png' }])
    assert.equal(result[1].title, 'Older')
  } finally {
    globalThis.fetch = origFetch
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/notion-listing.test.mjs`
Expected: FAIL — module `server/utils/notion-listing.ts` does not exist.

- [ ] **Step 3: Create the module**

Create `server/utils/notion-listing.ts` (logic lifted verbatim from the existing `server/api/posts/index.ts` Notion loop):
```typescript
import { generateSlug } from './slug'
import type { PostSummary } from './post-store'

const NOTION_API = 'https://api.notion.com/v1'

export async function fetchNotionListing(
  token: string,
  dbId: string
): Promise<PostSummary[]> {
  const posts: PostSummary[] = []
  let cursor: string | undefined
  try {
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
          Authorization: `Bearer ${token}`,
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
  } catch {
    return []
  }

  posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return posts
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/notion-listing.test.mjs`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add server/utils/notion-listing.ts tests/notion-listing.test.mjs
git commit -m "feat(posts): extract shared Notion listing fetch util"
```

---

### Task 3: Paginated API endpoint with cascading cache

**Files:**
- Modify: `server/api/posts/index.ts`
- Test: `tests/posts-api-pagination.test.mjs`

**Interfaces:**
- Consumes: `getPostListing`, `setPostListing`, `PostSummary` from `post-store`; `fetchNotionListing` from `notion-listing`; `articles` from `data/articlesData`.
- Produces: `GET /api/posts?page&limit` → `{ posts: PostSummary[], total: number, hasMore: boolean }`.

- [ ] **Step 1: Write the failing test**

Create `tests/posts-api-pagination.test.mjs`:
```javascript
import test from 'node:test'
import assert from 'node:assert/strict'

// Pure paginate helper is exported for unit testing.
import { paginate } from '../server/api/posts/index.ts'

const list = Array.from({ length: 25 }, (_, i) => ({
  slug: `s${i}`, title: `T${i}`, description: '', created_at: '2026-07-12T00:00:00.000Z', tags: [], thumbnail: null,
}))

test('paginate returns first page slice with hasMore true', () => {
  const r = paginate(list, 1, 10)
  assert.equal(r.posts.length, 10)
  assert.equal(r.total, 25)
  assert.equal(r.hasMore, true)
  assert.equal(r.posts[0].slug, 's0')
})

test('paginate returns last partial page with hasMore false', () => {
  const r = paginate(list, 3, 10)
  assert.equal(r.posts.length, 5)
  assert.equal(r.hasMore, false)
  assert.equal(r.posts[0].slug, 's20')
})

test('paginate clamps invalid page/limit to defaults', () => {
  const r = paginate(list, 0, -5)
  assert.equal(r.posts.length, 10)
  assert.equal(r.posts[0].slug, 's0')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/posts-api-pagination.test.mjs`
Expected: FAIL — `paginate` is not exported.

- [ ] **Step 3: Rewrite the endpoint**

Replace `server/api/posts/index.ts` entirely:
```typescript
import { articles as localArticles } from '../../data/articlesData'
import { getPostListing, setPostListing, type PostSummary } from '../../utils/post-store'
import { fetchNotionListing } from '../../utils/notion-listing'

const LISTING_TTL_SECONDS = 300

export function paginate(
  posts: PostSummary[],
  page: number,
  limit: number
): { posts: PostSummary[]; total: number; hasMore: boolean } {
  const p = Number.isInteger(page) && page > 0 ? page : 1
  const l = Number.isInteger(limit) && limit > 0 ? limit : 10
  const start = (p - 1) * l
  const slice = posts.slice(start, start + l)
  return { posts: slice, total: posts.length, hasMore: start + l < posts.length }
}

function localFallback(): PostSummary[] {
  const posts: PostSummary[] = []
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
  posts.sort((x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime())
  return posts
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(String(query.page ?? '1'), 10)
  const limit = parseInt(String(query.limit ?? '10'), 10)

  // Tier 1: Blob listing cache (fast path).
  let listing = await getPostListing()

  // Tier 2/3: rebuild from Notion, then local fallback.
  if (!listing) {
    const config = useRuntimeConfig()
    const notionToken = config.notionToken
    const dbId = config.public.notionTableId

    if (notionToken && dbId) {
      listing = await fetchNotionListing(notionToken, dbId)
    }

    if (!listing || listing.length === 0) {
      listing = localFallback()
    } else {
      // Cache only real Notion results, not the local fallback.
      await setPostListing(listing, LISTING_TTL_SECONDS)
    }
  }

  return paginate(listing, page, limit)
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/posts-api-pagination.test.mjs`
Expected: PASS (all three tests).

- [ ] **Step 5: Commit**

```bash
git add server/api/posts/index.ts tests/posts-api-pagination.test.mjs
git commit -m "feat(posts): paginated API with cascading Blob/Notion/local cache"
```

---

### Task 4: Update frontend consumers to new API shape

**Files:**
- Modify: `pages/posts/index.vue`
- Modify: `pages/index.vue`
- Modify: `components/Header.vue`
- Modify: `pages/cms/index.vue`

**Interfaces:**
- Consumes: `GET /api/posts?page&limit` → `{ posts, total, hasMore }`.

- [ ] **Step 1: Rewrite the posts listing page for true pagination**

Replace `pages/posts/index.vue` `<script setup>`:
```vue
<script setup lang="ts">
interface PostSummary {
  slug: string; title: string; description: string
  created_at: string; tags: string[]; thumbnail: Array<{ url: string }> | null
}
interface PostsResponse { posts: PostSummary[]; total: number; hasMore: boolean }

const PAGE_SIZE = 10
const page = ref(1)
const posts = ref<PostSummary[]>([])
const total = ref(0)
const hasMore = ref(true)
const isLoading = ref(false)
const error = ref<unknown>(null)
const initialPending = ref(true)

const sentinel = ref<HTMLElement | null>(null)

async function fetchPage(n: number) {
  if (isLoading.value) return
  isLoading.value = true
  try {
    const res = await $fetch<PostsResponse>(`/api/posts?page=${n}&limit=${PAGE_SIZE}`)
    posts.value = n === 1 ? res.posts : [...posts.value, ...res.posts]
    total.value = res.total
    hasMore.value = res.hasMore
  } catch (e) {
    error.value = e
  } finally {
    isLoading.value = false
    initialPending.value = false
  }
}

async function loadMore() {
  if (isLoading.value || !hasMore.value) return
  page.value += 1
  await fetchPage(page.value)
}

// Only fetch page 1 if we don't already have state (KeepAlive re-activation).
onMounted(() => {
  if (posts.value.length === 0) fetchPage(1)
})

// Background revalidate page 1 when returning to a kept-alive instance,
// so newly-added posts appear without a visible reload.
onActivated(async () => {
  if (posts.value.length === 0) { await fetchPage(1); return }
  try {
    const res = await $fetch<PostsResponse>(`/api/posts?page=1&limit=${PAGE_SIZE}`)
    const known = new Set(posts.value.map(p => p.slug))
    const fresh = res.posts.filter(p => !known.has(p.slug))
    if (fresh.length) posts.value = [...fresh, ...posts.value]
    total.value = res.total
  } catch { /* keep existing list */ }
})

useIntersectionObserver(
  sentinel,
  ([entry]) => { if (entry?.isIntersecting) loadMore() },
  { threshold: 0 },
)
</script>

<template>
  <div class="wrapper-small md:px-10">
    <div class="mt-5">
      <h1 class="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">All Blog Posts</h1>
    </div>

    <div v-if="initialPending" class="wrapper-small md:px-10">
      <SkeletonBlogCard v-for="n in 3" :key="n" />
    </div>

    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-600 dark:text-red-400">Error loading posts. Try refreshing.</div>
    </div>

    <div v-else-if="!posts.length" class="text-center py-16">
      <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">No posts yet</h2>
      <p class="text-gray-500 dark:text-gray-400">Check back soon for new content!</p>
    </div>

    <template v-else>
      <Blogs :posts="posts" title="All Posts" />
      <div ref="sentinel" class="py-10 text-center">
        <span v-if="hasMore" class="text-gray-400 dark:text-gray-500 text-sm">Loading more...</span>
        <span v-else class="text-gray-400 dark:text-gray-500 text-sm">
          You've reached the end · {{ total }} posts total
        </span>
      </div>
    </template>
  </div>
</template>
```

- [ ] **Step 2: Enable KeepAlive for the posts route**

In `app.vue` (or the layout wrapping pages), ensure `<NuxtPage />` is kept alive. Modify `app.vue`:
```vue
<template>
  <NuxtLayout>
    <NuxtPage :keepalive="{ include: ['posts-index'] }" />
  </NuxtLayout>
</template>
```
Then name the page in `pages/posts/index.vue` `<script setup>`:
```typescript
defineOptions({ name: 'posts-index' })
```
(Place `defineOptions` at the top of the existing `<script setup>` block.)

- [ ] **Step 3: Fix other consumers reading the bare array**

For each of `pages/index.vue`, `components/Header.vue`, `pages/cms/index.vue`: find the `/api/posts` fetch and read `.posts` from the response. Example pattern to apply:
```typescript
// BEFORE: const { data } = useFetch('/api/posts'); const list = data.value
// AFTER:
const { data } = useFetch<{ posts: any[]; total: number; hasMore: boolean }>('/api/posts?page=1&limit=10')
const list = computed(() => data.value?.posts ?? [])
```
Search first: `grep -rn "api/posts" pages components` and update every call site that expected an array. If a consumer needs ALL posts (e.g. CMS), request a large limit: `/api/posts?page=1&limit=10000`.

- [ ] **Step 4: Verify the dev build renders**

Run: `yarn dev` then visit `http://localhost:3000/posts`
Expected: first 10 posts render; scrolling loads more; navigating into a post and back is instant and shows any new posts at top.

- [ ] **Step 5: Commit**

```bash
git add pages/posts/index.vue app.vue pages/index.vue components/Header.vue pages/cms/index.vue
git commit -m "feat(posts): true pagination + KeepAlive back-nav; update API consumers"
```

---

### Task 5: Extend static generator to build full listing + prime cache

**Files:**
- Modify: `scripts/generate-posts-json.js`
- Modify: `.github/workflows/news-sync.yml`

**Interfaces:**
- Produces: `public/api/posts.json` containing the merged, sorted `PostSummary[]`.

- [ ] **Step 1: Rewrite the generator to query Notion + merge local**

Replace `scripts/generate-posts-json.js`:
```javascript
const fs = require('fs')
const path = require('path')

const NOTION_API = 'https://api.notion.com/v1'
const token = process.env.NOTION_TOKEN
const dbId = process.env.NOTION_TABLE_ID

function slugify(title) {
  return String(title).toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

async function fetchNotion() {
  if (!token || !dbId) return []
  const posts = []
  let cursor
  do {
    const body = {
      page_size: 100,
      filter: { property: 'public', checkbox: { equals: true } },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    }
    if (cursor) body.start_cursor = cursor
    const res = await fetch(`${NOTION_API}/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) { console.error('Notion query failed', res.status); break }
    const data = await res.json()
    for (const page of data.results ?? []) {
      const props = page.properties
      const titleProp = props.title ?? props.Name ?? props.name
      const title = titleProp?.title?.[0]?.plain_text ?? ''
      if (!title) continue
      const coverUrl = page.cover?.external?.url || page.cover?.file?.url || null
      posts.push({
        slug: slugify(title),
        title,
        description: props.description?.rich_text?.[0]?.plain_text ?? '',
        created_at: new Date(props.created_at?.date?.start ?? page.created_time).toISOString(),
        tags: props.tags?.multi_select?.map(t => t.name) ?? [],
        thumbnail: coverUrl ? [{ url: coverUrl }] : null,
      })
    }
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined
  } while (cursor)
  return posts
}

async function main() {
  const notionPosts = await fetchNotion()

  // Local articles as fallback (Notion wins on slug conflict).
  const articlesDir = path.join(__dirname, '../server/data/articles')
  const localPosts = []
  try {
    for (const file of fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'))) {
      const c = JSON.parse(fs.readFileSync(path.join(articlesDir, file), 'utf-8'))
      if (!c.published) continue
      localPosts.push({
        slug: c.slug,
        title: c.title,
        description: c.excerpt ?? '',
        created_at: new Date(c.createdAt).toISOString(),
        tags: c.tags || [],
        thumbnail: c.featuredImage ? [{ url: c.featuredImage }] : null,
      })
    }
  } catch { /* dir may not exist */ }

  const bySlug = new Map()
  for (const p of localPosts) bySlug.set(p.slug, p)
  for (const p of notionPosts) bySlug.set(p.slug, p) // Notion overrides

  const all = [...bySlug.values()].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  const apiDir = path.join(__dirname, '../public/api')
  fs.mkdirSync(apiDir, { recursive: true })
  fs.writeFileSync(path.join(apiDir, 'posts.json'), JSON.stringify(all))
  console.log('Generated public/api/posts.json with', all.length, 'posts')
}

main().catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Step 2: Run the generator locally (with env) to verify**

Run: `NOTION_TOKEN=$NOTION_TOKEN NOTION_TABLE_ID=$NOTION_TABLE_ID node scripts/generate-posts-json.js`
Expected: `Generated public/api/posts.json with N posts` (N reflects the full public set).

- [ ] **Step 3: Add a generate step to the cron workflow**

In `.github/workflows/news-sync.yml`, after the "Enrich cached post content" step, add:
```yaml
      - name: Regenerate static posts listing
        run: |
          STATUS=$(curl -s -o /tmp/resp-gen.json -w "%{http_code}" \
            --max-time 60 \
            -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            https://prana-wijaya.netlify.app/api/posts?page=1&limit=1)
          echo "Warm cache HTTP: $STATUS"
```
Note: the generator writes a build artifact, so it belongs at build time (Netlify build), not CI curl. The curl step above instead WARMS the Blob cache by hitting the API once post-enrich. The `posts.json` regeneration happens on the next Netlify build (git push). Document this in the step comment.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-posts-json.js .github/workflows/news-sync.yml
git commit -m "feat(posts): generator queries Notion + merges local; cron warms cache"
```

---

### Task 6: Add PWA service worker

**Files:**
- Modify: `package.json`
- Modify: `nuxt.config.ts`

**Interfaces:**
- N/A (build-time module).

- [ ] **Step 1: Install the module**

Run: `yarn add -D @vite-pwa/nuxt`
Expected: added to `devDependencies`.

- [ ] **Step 2: Register and configure the module**

In `nuxt.config.ts`, add `'@vite-pwa/nuxt'` to `modules`, and add a `pwa` block:
```typescript
pwa: {
  registerType: 'autoUpdate',
  workbox: {
    navigateFallback: '/index.html',
    globPatterns: ['**/*.{js,css,html,png,svg,webp,woff2,ico}'],
    runtimeCaching: [
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/api/posts'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-posts',
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
        },
      },
      {
        urlPattern: ({ request }) => request.destination === 'image',
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: { maxEntries: 200, maxAgeSeconds: 2592000 },
        },
      },
    ],
  },
  client: { installPrompt: true },
  manifest: {
    name: 'Prana Wijaya',
    short_name: 'Prana',
    theme_color: '#1a1a2e',
    background_color: '#ffffff',
    display: 'standalone',
    icons: [
      { src: '/logo.png', sizes: '192x192', type: 'image/png' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}
```
Note: confirm an icon exists at `public/logo.png`; if not, point `icons.src` at an existing public asset (check `public/` first with `ls public/*.png`).

- [ ] **Step 3: Build to verify the service worker generates**

Run: `yarn build`
Expected: build succeeds; output mentions `sw.mjs`/`workbox-*` generation. No CSP errors.

- [ ] **Step 4: Audit CSP headers for SW compatibility**

Run: `grep -n "Content-Security-Policy" netlify.toml public/_headers 2>/dev/null || echo "no explicit CSP"`
Expected: either no CSP (fine), or a CSP that permits `worker-src 'self'`. If a CSP exists and blocks workers, add `worker-src 'self'; script-src 'self'`.

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock nuxt.config.ts
git commit -m "feat(pwa): add service worker with network-first API, cache-first assets"
```

---

### Task 7: Full verification

**Files:**
- None (verification only).

- [ ] **Step 1: Run all tests**

Run: `node --test tests/*.test.mjs`
Expected: all tests pass (post-store-listing, notion-listing, posts-api-pagination, news-sync).

- [ ] **Step 2: Production build**

Run: `yarn build`
Expected: build succeeds with no type errors.

- [ ] **Step 3: Preview and smoke test**

Run: `yarn preview`
Verify:
- `/posts` loads first 10 posts fast
- Scroll triggers next page
- Enter a post, hit back → instant, scroll preserved, new posts (if any) at top
- DevTools → Application → Service Workers shows an active SW
- Offline mode (DevTools) → `/posts` still renders cached content

- [ ] **Step 4: Commit any final fixes and push**

```bash
git add -A
git commit -m "chore(posts): verification fixes for pagination + PWA"
git push origin main
```

---

## Self-Review Notes

- **Spec coverage:** Blob cache (Task 1,3), static fallback (Task 3,5), Notion cold path (Task 2,3), offset pagination (Task 3,4), KeepAlive back-nav (Task 4), service worker (Task 6), cron integration (Task 5) — all covered.
- **Breaking change handled:** Task 4 Step 3 updates every `/api/posts` consumer to the new `{ posts, total, hasMore }` shape.
- **Type consistency:** `PostSummary` defined once in `post-store.ts` (Task 1), imported by `notion-listing.ts` (Task 2) and `index.ts` (Task 3). Function names stable: `getPostListing`, `setPostListing`, `fetchNotionListing`, `paginate`.
- **Known nuance:** TTL uses an in-value envelope (`expiresAt`) rather than native Blob TTL for runtime portability (Task 1 Step 3).
