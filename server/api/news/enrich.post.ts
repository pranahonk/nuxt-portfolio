import { generateSlug } from '../../utils/slug'
import { fetchContentFromUrl } from '../../utils/content-fetcher'
import { setCachedPost } from '../../utils/post-store'
import { buildSafeSourceLink, getNotionCoverUrl, isSafeRemoteUrl } from '../../utils/content-security'

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'
const ENRICH_BUDGET_MS = 22_000
const ENRICH_FETCH_TIMEOUT_MS = 6_000
const NOTION_API_TIMEOUT_MS = 4_000
const NOTION_RATE_LIMIT_MS = 350

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
}

interface NotionPage {
  id: string
  properties: Record<string, any>
}

function assertAuth(event: Parameters<typeof getHeader>[0], secret: string) {
  const header = getHeader(event, 'authorization') ?? ''
  if (!secret || header !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

function getTitle(page: NotionPage): string {
  const prop = page.properties?.Name ?? page.properties?.Title ?? page.properties?.title ?? page.properties?.['title']
  return prop?.title?.[0]?.plain_text ?? ''
}

function getTags(page: NotionPage): string[] {
  const prop = page.properties?.tags ?? page.properties?.Tags
  return Array.isArray(prop?.multi_select)
    ? prop.multi_select.map((tag: { name?: string }) => tag.name).filter(Boolean)
    : []
}

function getDescription(page: NotionPage): string {
  const prop = page.properties?.description ?? page.properties?.Description
  const nodes = Array.isArray(prop?.rich_text) ? prop.rich_text : []
  return nodes.map((node: { plain_text?: string }) => node.plain_text ?? '').join('').trim()
}

async function fetchRecentDevToPages(token: string, dbId: string): Promise<NotionPage[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const res = await fetch(`${NOTION_API}/databases/${dbId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page_size: 100,
      filter: {
        and: [
          {
            property: 'created_at',
            date: { on_or_after: since },
          },
          {
            property: 'tags',
            multi_select: { contains: 'dev-to' },
          },
        ],
      },
    }),
    signal: AbortSignal.timeout(NOTION_API_TIMEOUT_MS),
  })

  if (!res.ok) return []
  const data = (await res.json()) as { results?: NotionPage[] }
  return data.results ?? []
}

async function getSourceUrlFromPage(token: string, pageId: string): Promise<string | null> {
  const res = await fetch(`${NOTION_API}/blocks/${pageId}/children?page_size=10`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
    },
    signal: AbortSignal.timeout(NOTION_API_TIMEOUT_MS),
  })
  if (!res.ok) return null

  const data = (await res.json()) as NotionBlocksResponse
  for (const block of data.results ?? []) {
    if (block.type !== 'paragraph') continue
    const rt = block.paragraph?.rich_text ?? []
    const linkUrl = rt[1]?.text?.link?.url ?? rt[1]?.href ?? null
    if (linkUrl) return linkUrl
    for (const node of rt) {
      const u = node?.text?.link?.url ?? node?.href ?? null
      if (u) return u
    }
  }
  return null
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

  const deadline = Date.now() + ENRICH_BUDGET_MS
  const pages = await fetchRecentDevToPages(notionToken, dbId)

  let enriched = 0
  let skipped = 0
  let errors = 0
  let budgetExhausted = false

  for (const page of pages) {
    if (Date.now() >= deadline) {
      budgetExhausted = true
      break
    }

    try {
      const sourceUrl = await getSourceUrlFromPage(notionToken, page.id)
      if (!sourceUrl || !isSafeRemoteUrl(sourceUrl)) {
        skipped++
        continue
      }

      const content = await fetchContentFromUrl(sourceUrl, ENRICH_FETCH_TIMEOUT_MS)
      if (!content) {
        skipped++
        continue
      }

      const title = getTitle(page)
      if (!title) {
        skipped++
        continue
      }

      const slug = generateSlug(title)
      await setCachedPost(slug, {
        slug,
        title,
        content: `${buildSafeSourceLink(sourceUrl)}${content.content}`,
        thumbnail: content.thumbnail || getNotionCoverUrl(page),
        excerpt: content.excerpt || getDescription(page),
        created_at: new Date().toISOString(),
        tags: getTags(page),
      })

      enriched++
      await new Promise((r) => setTimeout(r, NOTION_RATE_LIMIT_MS))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`enrich failed for page ${page.id}:`, msg)
      errors++
    }
  }

  return { enriched, skipped, errors, scanned: pages.length, budgetExhausted }
})
