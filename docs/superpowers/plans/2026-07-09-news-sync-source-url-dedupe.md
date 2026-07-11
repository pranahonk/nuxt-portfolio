# News Sync Source URL Dedupe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `server/api/news/sync.post.ts` dedupe articles by source URL using Notion properties `source_url` or `Source URL`, so sync can add new articles without exhausting its 8-second budget on a full title scan.

**Architecture:** Keep the workflow and endpoint contract unchanged, but replace the full-database title pre-scan with a narrower source URL read path. The sync endpoint will detect a writable source URL property, read existing source URLs for dedupe, and keep normalized-title fallback only as a temporary migration guard for legacy Notion rows without a source URL.

**Tech Stack:** Nuxt 3 Nitro server routes, TypeScript, `@notionhq/client`, native `fetch`, GitHub Actions-triggered Netlify functions

## Global Constraints

- No changes to the GitHub Actions workflow.
- No changes to front-end routes or rendering.
- No changes to `news/enrich` behavior.
- No repo rebuild or static generation redesign.
- No permanent reliance on title-only dedupe.
- Support both Notion property names exactly: `source_url` and `Source URL`.
- If both names exist, prefer `source_url` for writes and continue reading both for resilience.
- If neither property exists, fail clearly instead of silently pretending the durable fix is active.
- Keep title-based fallback only as a temporary migration guard for legacy rows that do not yet have a source URL property populated.
- Preserve the sync endpoint response shape exactly: `added`, `skipped`, `total`, `budgetExhausted`.

---

## File Structure

- Modify: `server/api/news/sync.post.ts`
  - Keep article source fetching logic unchanged.
  - Replace `getExistingTitles(...)` with source-URL-aware Notion helpers.
  - Add property detection and extraction helpers local to the file.
  - Update `createNotionPage(...)` to write the source URL property.
  - Preserve deadline handling and response shape.

No new files are required for this implementation.

### Task 1: Add source URL property helpers and writable-property detection

**Files:**
- Modify: `server/api/news/sync.post.ts`
- Test: no dedicated test file exists in this repo; verification will be done by targeted local build/type check plus endpoint-level exercise after code change

**Interfaces:**
- Consumes: existing `Article` interface in `server/api/news/sync.post.ts`
- Produces:
  - `const SOURCE_URL_PROPERTY_CANDIDATES = ['source_url', 'Source URL'] as const`
  - `function normalizeSourceUrl(url: string): string`
  - `function getTitleKey(title: string): string`
  - `function extractSourceUrlPropertyName(properties: Record<string, unknown>): 'source_url' | 'Source URL' | null`
  - `function extractExistingSourceUrl(properties: Record<string, unknown>): string | null`

- [ ] **Step 1: Add helper constants and functions near the top of `server/api/news/sync.post.ts`**

```ts
const SOURCE_URL_PROPERTY_CANDIDATES = ['source_url', 'Source URL'] as const

type SourceUrlPropertyName = (typeof SOURCE_URL_PROPERTY_CANDIDATES)[number]

function normalizeSourceUrl(url: string): string {
  return url.trim()
}

function getTitleKey(title: string): string {
  return title.toLowerCase().trim()
}

function extractSourceUrlPropertyName(
  properties: Record<string, unknown>
): SourceUrlPropertyName | null {
  for (const candidate of SOURCE_URL_PROPERTY_CANDIDATES) {
    const property = properties[candidate] as { type?: string } | undefined
    if (property?.type === 'url') return candidate
  }
  return null
}

function extractExistingSourceUrl(properties: Record<string, unknown>): string | null {
  for (const candidate of SOURCE_URL_PROPERTY_CANDIDATES) {
    const property = properties[candidate] as { url?: string | null } | undefined
    const value = property?.url?.trim()
    if (value) return normalizeSourceUrl(value)
  }
  return null
}
```

- [ ] **Step 2: Add a local title-key helper for existing title dedupe fallback**

Replace repeated title normalization logic with this helper usage:

```ts
const key = getTitleKey(article.title)
```

Expected result: all title-key comparisons use the same helper, making the temporary fallback explicit and easy to remove later.

- [ ] **Step 3: Run the project build to confirm the helpers compile before changing control flow**

Run: `yarn build`
Expected: build succeeds with no new TypeScript errors.

- [ ] **Step 4: Commit the helper-only change**

```bash
git add server/api/news/sync.post.ts
git commit -m "refactor(news-sync): add source url helper functions"
```

### Task 2: Replace full title pre-scan with source URL-aware Notion lookup

**Files:**
- Modify: `server/api/news/sync.post.ts`
- Test: no dedicated test file exists; verify through build and endpoint-level behavior check

**Interfaces:**
- Consumes:
  - `normalizeSourceUrl(url: string): string`
  - `getTitleKey(title: string): string`
  - `extractSourceUrlPropertyName(properties: Record<string, unknown>): 'source_url' | 'Source URL' | null`
  - `extractExistingSourceUrl(properties: Record<string, unknown>): string | null`
- Produces:
  - `async function getExistingSourceState(token: string, dbId: string, deadline: number): Promise<{ sourceUrls: Set<string>; legacyTitleKeys: Set<string>; writablePropertyName: 'source_url' | 'Source URL' }>`

- [ ] **Step 1: Replace `getExistingTitles(...)` with a new source-state reader**

Replace the old function with this implementation shape:

```ts
async function getExistingSourceState(
  token: string,
  dbId: string,
  deadline: number
): Promise<{
  sourceUrls: Set<string>
  legacyTitleKeys: Set<string>
  writablePropertyName: SourceUrlPropertyName
}> {
  const sourceUrls = new Set<string>()
  const legacyTitleKeys = new Set<string>()
  let writablePropertyName: SourceUrlPropertyName | null = null
  let cursor: string | undefined

  do {
    if (Date.now() >= deadline) break

    const body: Record<string, unknown> = { page_size: 100 }
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`${NOTION_API}/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
    })
    if (!res.ok) break

    const data: {
      results: Array<{ properties: Record<string, unknown> }>
      has_more: boolean
      next_cursor: string | null
    } = await res.json()

    for (const page of data.results ?? []) {
      const properties = page.properties ?? {}

      if (!writablePropertyName) {
        writablePropertyName = extractSourceUrlPropertyName(properties)
      }

      const existingUrl = extractExistingSourceUrl(properties)
      if (existingUrl) {
        sourceUrls.add(existingUrl)
        continue
      }

      const titleProp =
        (properties.Name as { title?: Array<{ plain_text: string }> } | undefined) ??
        (properties.Title as { title?: Array<{ plain_text: string }> } | undefined) ??
        (properties.title as { title?: Array<{ plain_text: string }> } | undefined)
      const title = titleProp?.title?.[0]?.plain_text ?? ''
      if (title) legacyTitleKeys.add(getTitleKey(title))
    }

    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined
  } while (cursor)

  if (!writablePropertyName) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Notion database must expose a url property named source_url or Source URL',
    })
  }

  return { sourceUrls, legacyTitleKeys, writablePropertyName }
}
```

- [ ] **Step 2: Update the main handler to consume the new source-state result**

Replace this:

```ts
const existingTitles = await getExistingTitles(notionToken, dbId, deadline)
```

with this:

```ts
const {
  sourceUrls: existingSourceUrls,
  legacyTitleKeys,
  writablePropertyName,
} = await getExistingSourceState(notionToken, dbId, deadline)
```

- [ ] **Step 3: Update the dedupe branch inside the sync loop**

Replace this block:

```ts
const key = article.title.toLowerCase().trim()
if (existingTitles.has(key)) {
  skipped++
  continue
}
```

with this block:

```ts
const sourceUrlKey = normalizeSourceUrl(article.url)
const titleKey = getTitleKey(article.title)

if (existingSourceUrls.has(sourceUrlKey) || legacyTitleKeys.has(titleKey)) {
  skipped++
  continue
}
```

Expected result: URL-based dedupe is primary; title fallback is only used for legacy rows without source URL.

- [ ] **Step 4: Run the build again after the control-flow swap**

Run: `yarn build`
Expected: build succeeds and `server/api/news/sync.post.ts` compiles with the new return type and property-name handling.

- [ ] **Step 5: Commit the dedupe lookup change**

```bash
git add server/api/news/sync.post.ts
git commit -m "fix(news-sync): dedupe by source url"
```

### Task 3: Write source URL on page creation and preserve in-memory dedupe state

**Files:**
- Modify: `server/api/news/sync.post.ts`
- Test: no dedicated test file exists; verify with build plus targeted manual endpoint check

**Interfaces:**
- Consumes:
  - `getExistingSourceState(...)` return value, especially `writablePropertyName`
  - `normalizeSourceUrl(url: string): string`
  - `getTitleKey(title: string): string`
- Produces:
  - `async function createNotionPage(notion: Client, dbId: string, article: Article, writablePropertyName: 'source_url' | 'Source URL'): Promise<void>`

- [ ] **Step 1: Update `createNotionPage(...)` signature to accept the writable property name**

Change the signature from:

```ts
async function createNotionPage(notion: Client, dbId: string, article: Article): Promise<void>
```

to:

```ts
async function createNotionPage(
  notion: Client,
  dbId: string,
  article: Article,
  writablePropertyName: SourceUrlPropertyName
): Promise<void>
```

- [ ] **Step 2: Add the chosen source URL property into the Notion create payload**

Inside `properties`, add:

```ts
[writablePropertyName]: {
  url: article.url,
},
```

So the relevant properties block becomes:

```ts
properties: {
  title: {
    title: [{ text: { content: article.title } }],
  },
  tags: {
    multi_select: article.tags.map(t => ({ name: t })),
  },
  description: {
    rich_text: [{ text: { content: article.description.slice(0, 2000) } }],
  },
  public: {
    checkbox: true,
  },
  created_at: {
    date: { start: new Date().toISOString() },
  },
  [writablePropertyName]: {
    url: article.url,
  },
},
```

- [ ] **Step 3: Update the create call in the main sync loop**

Replace:

```ts
await createNotionPage(notion, dbId, article)
existingTitles.add(key)
```

with:

```ts
await createNotionPage(notion, dbId, article, writablePropertyName)
existingSourceUrls.add(sourceUrlKey)
legacyTitleKeys.add(titleKey)
```

Expected result: the same run does not recreate an article if a duplicate candidate appears later in-memory.

- [ ] **Step 4: Run the full build and then do a targeted manual endpoint verification**

Run build:

```bash
yarn build
```

Expected: build succeeds.

Then trigger the sync endpoint in a real environment that has the required secrets configured:

```bash
curl -s -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  https://prana-wijaya.netlify.app/api/news/sync
```

Expected response shape:

```json
{"added":<number>,"skipped":<number>,"total":<number>,"budgetExhausted":<boolean>}
```

Expected behavior to confirm manually:
- duplicate existing source URLs increment `skipped`
- at least one new article can be added without the old zero-added/full-budget symptom when qualifying new items exist
- if the Notion schema lacks both URL property names, the endpoint fails clearly

- [ ] **Step 5: Commit the write-path and verification-backed fix**

```bash
git add server/api/news/sync.post.ts
git commit -m "fix(news-sync): store source url on synced pages"
```

## Self-Review Checklist

- Spec coverage: all spec requirements are covered by the three tasks above:
  - canonical URL dedupe
  - support for both `source_url` and `Source URL`
  - clear failure if neither exists
  - temporary title fallback only for legacy rows
  - unchanged endpoint response shape
- Placeholder scan: no `TODO`, `TBD`, or vague “handle appropriately” steps remain.
- Type consistency: all later tasks use the same helper names and the same `SourceUrlPropertyName` union.
