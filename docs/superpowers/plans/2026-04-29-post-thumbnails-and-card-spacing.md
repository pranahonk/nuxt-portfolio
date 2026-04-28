# Post Thumbnails Backfill and Card Spacing Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two issues on the `/posts` listing page: (1) post cards have no cover image because all 81 existing Notion DB rows have `thumbnail: null` — create a one-shot backfill endpoint that scrapes the OG image from each article's source URL and PATCHes it onto the Notion page's `cover` field; (2) too much horizontal gap between the image and text block because `mx-auto` is applied to the text column inside a flex-row — replace with `md:flex-1 md:mx-0`.

**Architecture:** New Nitro POST route `server/api/news/backfill-covers.post.ts` paginates the Notion DB, finds pages where `cover` is null, opens each page's first paragraph block to read the source URL stored in `rich_text[1].text.link.url` (the layout written by `sync.post.ts`), fetches that URL with a 3-second `AbortController` timeout, regex-parses `<meta property="og:image">` from the HTML, and PATCHes `cover.external.url` onto the Notion page. Auth uses the same `assertAuth(event, cronSecret)` Bearer-token pattern already in `sync.post.ts`. Rate-limited to 350ms between Notion writes. One-line CSS change to `Blogs.vue` line 37 fixes the gap.

**Tech Stack:** Nuxt 3 / Nitro (`defineEventHandler`, `useRuntimeConfig`, `getHeader`, `createError`), raw `fetch` for Notion REST + OG-image scraping, Tailwind CSS v3.

---

## Files to Change

| File | Action | Reason |
|------|--------|--------|
| `components/Blogs.vue` | Modify line 37 only | Replace `mx-auto` (centers text in flex-row) with `md:flex-1 md:mx-0` so text sits flush against image |
| `server/api/news/backfill-covers.post.ts` | Create | One-shot backfill endpoint to populate `cover` on existing Notion pages by scraping OG images |

---

### Task 1: Fix card spacing in `components/Blogs.vue`

**Files:**
- Modify: `components/Blogs.vue` (line 37 only)

- [ ] **Step 1: Update line 37**

In `components/Blogs.vue`, change:

```html
        <div class="flex flex-col justify-between max-w-lg mx-auto">
```

to:

```html
        <div class="flex flex-col justify-between max-w-lg mx-auto md:flex-1 md:mx-0">
```

No other lines change. Mobile (default) still gets `mx-auto` to keep the text centered when the layout stacks vertically; on `md+` `mx-0` neutralises the auto margins and `flex-1` lets the text column consume the remaining horizontal space inside the `md:flex` row.

- [ ] **Step 2: Verify visually**

```bash
yarn dev
```

Open http://localhost:3000/posts at `>= 768px` viewport. Expected: text block sits immediately to the right of the image with normal gap (the existing `md:mr-4` on the image div provides the spacing). At `< 768px` the layout stacks and the text remains horizontally centered.

- [ ] **Step 3: Commit**

```bash
git add components/Blogs.vue
git commit -m "fix(posts): remove excess gap between card image and text on md+ breakpoints"
```

---

### Task 2: Create the OG-image backfill endpoint

**Files:**
- Create: `server/api/news/backfill-covers.post.ts`

- [ ] **Step 1: Create the file with the full implementation**

Create `server/api/news/backfill-covers.post.ts`:

```ts
const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'
const FETCH_TIMEOUT_MS = 3000
const NOTION_RATE_LIMIT_MS = 350

interface NotionPage {
  id: string
  cover: { external?: { url: string }; file?: { url: string } } | null
}

interface NotionQueryResponse {
  results: NotionPage[]
  has_more: boolean
  next_cursor: string | null
}

interface NotionRichText {
  type?: string
  text?: { content?: string; link?: { url: string } | null }
  plain_text?: string
  href?: string | null
}

interface NotionBlock {
  id: string
  type: string
  paragraph?: { rich_text?: NotionRichText[] }
}

interface NotionBlocksResponse {
  results: NotionBlock[]
  has_more: boolean
  next_cursor: string | null
}

function assertAuth(event: Parameters<typeof getHeader>[0], secret: string) {
  const header = getHeader(event, 'authorization') ?? ''
  if (!secret || header !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

async function fetchAllUncoveredPages(token: string, dbId: string): Promise<NotionPage[]> {
  const pages: NotionPage[] = []
  let cursor: string | undefined

  do {
    const body: Record<string, unknown> = { page_size: 100 }
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`${NOTION_API}/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) break

    const data = (await res.json()) as NotionQueryResponse
    for (const p of data.results ?? []) {
      const hasCover = !!(p.cover?.external?.url || p.cover?.file?.url)
      if (!hasCover) pages.push({ id: p.id, cover: p.cover ?? null })
    }
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined
  } while (cursor)

  return pages
}

async function getSourceUrlFromPage(token: string, pageId: string): Promise<string | null> {
  const res = await fetch(`${NOTION_API}/blocks/${pageId}/children?page_size=10`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
    },
  })
  if (!res.ok) return null

  const data = (await res.json()) as NotionBlocksResponse
  for (const block of data.results ?? []) {
    if (block.type !== 'paragraph') continue
    const rt = block.paragraph?.rich_text ?? []
    // sync.post.ts writes rich_text[0] = "🔗 Source: ", rich_text[1] = the URL link
    const linkUrl = rt[1]?.text?.link?.url ?? rt[1]?.href ?? null
    if (linkUrl) return linkUrl
    // Defensive: scan all rich_text entries for any link
    for (const node of rt) {
      const u = node?.text?.link?.url ?? node?.href ?? null
      if (u) return u
    }
    // Only check the first paragraph block
    return null
  }
  return null
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'prana-portfolio/backfill-covers',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })
    return res
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

async function extractOgImage(sourceUrl: string): Promise<string | null> {
  const res = await fetchWithTimeout(sourceUrl, FETCH_TIMEOUT_MS)
  if (!res || !res.ok) return null
  const ct = res.headers.get('content-type') ?? ''
  if (!ct.includes('text/html') && !ct.includes('application/xhtml')) return null

  const html = await res.text()
  const m1 = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
  const m2 = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
  const url = m1?.[1] || m2?.[1] || null
  if (!url) return null

  // Resolve protocol-relative or path-relative URLs against the source URL
  try {
    return new URL(url, sourceUrl).toString()
  } catch {
    return null
  }
}

async function patchNotionCover(token: string, pageId: string, imageUrl: string): Promise<boolean> {
  const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cover: { type: 'external', external: { url: imageUrl } },
    }),
  })
  return res.ok
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  assertAuth(event, config.cronSecret ?? '')

  const notionToken = config.notionToken
  const dbId = config.public.notionTableId

  if (!notionToken) {
    throw createError({ statusCode: 500, statusMessage: 'NOTION_TOKEN not configured' })
  }
  if (!dbId) {
    throw createError({ statusCode: 500, statusMessage: 'NOTION_TABLE_ID not configured' })
  }

  const pages = await fetchAllUncoveredPages(notionToken, dbId)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const page of pages) {
    try {
      const sourceUrl = await getSourceUrlFromPage(notionToken, page.id)
      if (!sourceUrl) {
        skipped++
        continue
      }

      const ogImage = await extractOgImage(sourceUrl)
      if (!ogImage) {
        skipped++
        continue
      }

      const ok = await patchNotionCover(notionToken, page.id, ogImage)
      if (ok) updated++
      else errors++

      await new Promise((r) => setTimeout(r, NOTION_RATE_LIMIT_MS))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`backfill-covers failed for page ${page.id}:`, msg)
      errors++
    }
  }

  return { updated, skipped, errors, scanned: pages.length }
})
```

- [ ] **Step 2: Smoke test locally**

Make sure `CRON_SECRET`, `NOTION_TOKEN`, and `NOTION_TABLE_ID` are set in `.env`, then:

```bash
yarn dev
```

In another shell:

```bash
# Must return 401:
curl -i -X POST http://localhost:3000/api/news/backfill-covers
curl -i -X POST http://localhost:3000/api/news/backfill-covers -H "Authorization: Bearer wrong"

# Must return 200 with JSON:
curl -i -X POST http://localhost:3000/api/news/backfill-covers \
  -H "Authorization: Bearer $CRON_SECRET"
```

Expected success response shape:

```json
{ "updated": 23, "skipped": 55, "errors": 3, "scanned": 81 }
```

Open Notion and confirm a page reported as `updated` now has a cover image. Reload http://localhost:3000/posts and confirm cards show thumbnails.

> **Netlify timeout note:** With ~81 pages × (block fetch + OG fetch + PATCH + 350ms sleep) the endpoint may take 60–90s, exceeding Netlify's 10s function timeout. Run it against `yarn dev` locally instead. The operation is idempotent — pages that already have covers are skipped on re-runs.

- [ ] **Step 3: Commit**

```bash
git add server/api/news/backfill-covers.post.ts
git commit -m "feat(news): add /api/news/backfill-covers to scrape OG images for existing Notion posts"
```

- [ ] **Step 4: Run the backfill against live Notion data**

With the dev server running locally (uses your `.env` credentials which point to production Notion):

```bash
curl -X POST http://localhost:3000/api/news/backfill-covers \
  -H "Authorization: Bearer $CRON_SECRET"
```

Re-run until `updated` is 0 — pages already covered are skipped, so re-running is safe.

---

## Risks and mitigations

- **Hot-linking blocked OG images.** Some CDNs block images on third-party domains. `Blogs.vue`'s `handleImageError` already nulls `post.thumbnail` on load error and the gradient placeholder takes over — no extra code needed.
- **Notion REST cover PATCH shape.** `{ type: "external", external: { url } }` is the documented 2022-06-28 form and matches the read shape in `server/api/posts/index.ts:68`.
- **Partial runs due to timeouts.** Endpoint is idempotent: `fetchAllUncoveredPages` only returns pages with no cover, so re-running is safe.

## Success criteria

- [ ] `yarn build` succeeds with no TypeScript errors.
- [ ] `curl` without bearer returns 401; with correct bearer returns `{ updated, skipped, errors, scanned }`.
- [ ] After running the backfill, `/posts` cards show thumbnails for Dev.to and HN articles that expose `og:image`.
- [ ] On `>= 768px` viewports, the post card text sits flush against the image with no large empty space.
- [ ] On `< 768px` viewports, the post card text remains horizontally centered.
