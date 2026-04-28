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
